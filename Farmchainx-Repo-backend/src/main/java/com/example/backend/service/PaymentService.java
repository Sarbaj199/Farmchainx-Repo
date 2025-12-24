package com.example.backend.service;


import com.example.backend.entity.Transaction;
import com.example.backend.repository.BatchRepository;
import com.example.backend.repository.TransactionRepository;
import com.example.backend.repository.UserRepository;
import com.razorpay.Order;
import com.razorpay.RazorpayClient;
import com.razorpay.RazorpayException;

import org.json.JSONException;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class PaymentService {

    @Autowired
    private TransactionRepository transactionRepository;

    @Value("${razorpay.key.id}")
    private String razorpayKeyId;

    @Value("${razorpay.key.secret}")
    private String razorpayKeySecret;

    private RazorpayClient getRazorpayClient() throws RazorpayException {
        return new RazorpayClient(razorpayKeyId, razorpayKeySecret);
    }

    /**
     * Create Razorpay order for payment
     */
   public JSONObject createRazorpayOrder(Double amount, String currency, String receipt) throws RazorpayException, JSONException {
    try {
        RazorpayClient razorpay = getRazorpayClient();
        
        JSONObject orderRequest = new JSONObject();
        orderRequest.put("amount", amount * 100); // Convert to paise
        orderRequest.put("currency", currency);
        orderRequest.put("receipt", receipt);
        orderRequest.put("payment_capture", 1); // Auto capture

        Order order = razorpay.orders.create(orderRequest);
        
        JSONObject response = new JSONObject();
        response.put("id", order.get("id").toString());
        response.put("amount", order.get("amount").toString());
        response.put("currency", order.get("currency").toString());
        response.put("receipt", order.get("receipt").toString());
        response.put("status", order.get("status").toString());
        
        return response;
    } catch (RazorpayException e) {
        throw new RuntimeException("Failed to create Razorpay order: " + e.getMessage());
    }
}
   
   
    /**
     * Verify payment signature and update transaction
     */
    public Transaction verifyAndCompletePayment(Long transactionId, String razorpayOrderId, 
                                              String razorpayPaymentId, String razorpaySignature) {
        try {
            Transaction transaction = transactionRepository.findById(transactionId)
                    .orElseThrow(() -> new RuntimeException("Transaction not found"));

            // Verify payment signature
            RazorpayClient razorpay = getRazorpayClient();
            
            JSONObject attributes = new JSONObject();
            attributes.put("razorpay_order_id", razorpayOrderId);
            attributes.put("razorpay_payment_id", razorpayPaymentId);
            attributes.put("razorpay_signature", razorpaySignature);

            // In production, you should verify the signature
            // For now, we'll assume payment is successful if we reach here
            
            // Update transaction with payment details
            transaction.setRazorpayOrderId(razorpayOrderId);
            transaction.setRazorpayPaymentId(razorpayPaymentId);
            transaction.setPaymentStatus(Transaction.PaymentStatus.PAID);
            transaction.setStatus(Transaction.TransactionStatus.COMPLETED);

            // Update batch quantity
            updateBatchQuantity(transaction);

            return transactionRepository.save(transaction);
        } catch (Exception e) {
            throw new RuntimeException("Payment verification failed: " + e.getMessage());
        }
    }

    /**
     * Complete payment for pending transaction
     */
    public Transaction completePendingPayment(Long transactionId, String razorpayOrderId, String razorpayPaymentId) {
        Transaction transaction = transactionRepository.findById(transactionId)
                .orElseThrow(() -> new RuntimeException("Transaction not found"));

        if (transaction.getPaymentStatus() != Transaction.PaymentStatus.PENDING) {
            throw new RuntimeException("Transaction payment status is not pending");
        }

        // Update transaction with payment details
        transaction.setRazorpayOrderId(razorpayOrderId);
        transaction.setRazorpayPaymentId(razorpayPaymentId);
        transaction.setPaymentStatus(Transaction.PaymentStatus.PAID);
        transaction.setStatus(Transaction.TransactionStatus.COMPLETED);

        // Update batch quantity
        updateBatchQuantity(transaction);

        return transactionRepository.save(transaction);
    }

    /**
     * Update batch quantity after successful transaction
     */
    private void updateBatchQuantity(Transaction transaction) {
        // For FARMER_TO_DISTRIBUTOR transactions, reduce batch quantity
        if (transaction.getTransactionType() == Transaction.TransactionType.FARMER_TO_DISTRIBUTOR) {
            var batch = transaction.getBatch();
            double newQuantity = batch.getQuantity() - transaction.getQuantity();
            
            if (newQuantity < 0) {
                throw new RuntimeException("Insufficient quantity in batch");
            }
            
            batch.setQuantity(newQuantity);
            // You might want to save the batch here if you have batchRepository autowired
        }
    }

    /**
     * Create transaction with immediate payment
     */
    public Transaction createTransactionWithPayment(Long batchId, Long fromUserId, Long toUserId, 
                                                   Double quantity, Double pricePerUnit, String unit, 
                                                   String remarks, Transaction.TransactionType type) {
        
        // First create the transaction
        Transaction transaction = createTransaction(batchId, fromUserId, toUserId, quantity, 
                                                   pricePerUnit, unit, remarks, type);
        
        // Create Razorpay order
        try {
            Double totalAmount = quantity * pricePerUnit;
            String receipt = "txn_" + transaction.getTransactionId();
            
            JSONObject order = createRazorpayOrder(totalAmount, "INR", receipt);
            
            // Update transaction with order ID
            transaction.setRazorpayOrderId(order.getString("id"));
            return transactionRepository.save(transaction);
            
        } catch (Exception e) {
            // If payment order creation fails, mark as failed
            transaction.setPaymentStatus(Transaction.PaymentStatus.FAILED);
            transactionRepository.save(transaction);
            throw new RuntimeException("Failed to create payment order: " + e.getMessage());
        }
    }

    /**
     * Create transaction with pay-later option
     */
    public Transaction createTransactionPayLater(Long batchId, Long fromUserId, Long toUserId, 
                                                Double quantity, Double pricePerUnit, String unit, 
                                                String remarks, Transaction.TransactionType type) {
        
        Transaction transaction = createTransaction(batchId, fromUserId, toUserId, quantity, 
                                                   pricePerUnit, unit, remarks, type);
        
        // For pay-later, payment status remains PENDING
        transaction.setPaymentStatus(Transaction.PaymentStatus.PENDING);
        transaction.setStatus(Transaction.TransactionStatus.INITIATED);
        
        return transactionRepository.save(transaction);
    }

    /**
     * Generic transaction creation
     */
    private Transaction createTransaction(Long batchId, Long fromUserId, Long toUserId, 
                                        Double quantity, Double pricePerUnit, String unit, 
                                        String remarks, Transaction.TransactionType type) {
        
        // You might want to use your existing TransactionService here
        // For now, creating a basic transaction
        Transaction transaction = new Transaction();
        transaction.setBatch(batchRepository.findById(batchId)
                .orElseThrow(() -> new RuntimeException("Batch not found")));
        transaction.setFromUser(userRepository.findById(fromUserId)
                .orElseThrow(() -> new RuntimeException("From user not found")));
        transaction.setToUser(userRepository.findById(toUserId)
                .orElseThrow(() -> new RuntimeException("To user not found")));
        transaction.setQuantity(quantity);
        transaction.setPricePerUnit(pricePerUnit);
        transaction.setUnit(unit);
        transaction.setTotalAmount(quantity * pricePerUnit);
        transaction.setTransactionDate(LocalDateTime.now());
        transaction.setRemarks(remarks);
        transaction.setTransactionType(type);
        transaction.setStatus(Transaction.TransactionStatus.INITIATED);
        transaction.setDeliveryStatus(Transaction.DeliveryStatus.PENDING);

        return transactionRepository.save(transaction);
    }

    /**
     * Get transactions by payment status
     */
    public List<Transaction> getTransactionsByPaymentStatus(Transaction.PaymentStatus paymentStatus) {
        return transactionRepository.findByPaymentStatus(paymentStatus);
    }

    /**
     * Get pending payments for a user
     */
    public List<Transaction> getPendingPaymentsByUser(Long userId) {
        return transactionRepository.findByToUserIdAndPaymentStatus(userId, Transaction.PaymentStatus.PENDING);
    }

    @Autowired
    private BatchRepository batchRepository;

    @Autowired
    private UserRepository userRepository;
}
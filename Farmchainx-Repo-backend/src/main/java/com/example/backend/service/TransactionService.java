package com.example.backend.service;

import com.example.backend.entity.*;
import com.example.backend.repository.TransactionRepository;
import com.example.backend.repository.BatchRepository;
import com.example.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
public class TransactionService {

    @Autowired
    private TransactionRepository transactionRepository;

    @Autowired
    private BatchRepository batchRepository;

    @Autowired
    private UserRepository userRepository;

    // ✅ Create transaction with payment option - FIXED VERSION
    @Transactional
    public Transaction createTransactionWithPaymentOption(Long batchId, Long fromUserId, Long toUserId, 
                                                     Double quantity, Double pricePerUnit, String unit, 
                                                     String remarks, Transaction.TransactionType type,
                                                     boolean payNow, String razorpayOrderId) {
    
        System.out.println("Creating transaction - Batch: " + batchId + ", From: " + fromUserId + ", To: " + toUserId);
        
        Batch batch = batchRepository.findById(batchId)
                .orElseThrow(() -> new RuntimeException("Batch not found with ID: " + batchId));

        User fromUser = userRepository.findById(fromUserId)
                .orElseThrow(() -> new RuntimeException("Sender not found with ID: " + fromUserId));

        User toUser = userRepository.findById(toUserId)
                .orElseThrow(() -> new RuntimeException("Receiver not found with ID: " + toUserId));

        // Validate quantity against available quantity
        if (quantity > batch.getAvailableQuantity()) {
            throw new RuntimeException("Requested quantity exceeds available quantity. Available: " + batch.getAvailableQuantity());
        }

        // Set payment status based on payNow flag
        Transaction.PaymentStatus paymentStatus = payNow ? 
            Transaction.PaymentStatus.PAID : Transaction.PaymentStatus.PENDING;
        
        Transaction.TransactionStatus transactionStatus = payNow ? 
            Transaction.TransactionStatus.INITIATED : Transaction.TransactionStatus.PENDING_PAYMENT;

        Transaction transaction = Transaction.builder()
                .batch(batch)
                .fromUser(fromUser)
                .toUser(toUser)
                .quantity(quantity)
                .unit(unit)
                .pricePerUnit(pricePerUnit)
                .totalAmount(quantity * pricePerUnit)
                .transactionDate(LocalDateTime.now())
                .remarks(remarks)
                .transactionType(type)
                .status(transactionStatus)
                .paymentStatus(paymentStatus)
                .deliveryStatus(Transaction.DeliveryStatus.PENDING)
                .razorpayOrderId(razorpayOrderId)
                .build();

        Transaction savedTransaction = transactionRepository.save(transaction);

        // Update batch available quantity
        updateBatchQuantity(batch, quantity);

        System.out.println("Transaction created successfully: " + savedTransaction.getTransactionId());
        return savedTransaction;
    }

    // ✅ Get transactions for retailer
public List<Transaction> getTransactionsForRetailer(Long retailerId) {
    // Get transactions where retailer is either sender (distributor→retailer) or receiver (retailer→customer)
    List<Transaction> receivedFromDistributor = transactionRepository.findByToUser_IdAndTransactionType(
        retailerId, 
        Transaction.TransactionType.DISTRIBUTOR_TO_RETAILER
    );
    List<Transaction> sentToCustomer = transactionRepository.findByFromUser_IdAndTransactionType(
        retailerId, 
        Transaction.TransactionType.RETAILER_TO_CUSTOMER
    );
    
    List<Transaction> allRetailerTransactions = new ArrayList<>();
    allRetailerTransactions.addAll(receivedFromDistributor);
    allRetailerTransactions.addAll(sentToCustomer);
    
    return allRetailerTransactions;
}

// ✅ Get transactions for customer
public List<Transaction> getTransactionsForCustomer(Long customerId) {
    return transactionRepository.findByToUser_IdAndTransactionType(
        customerId, 
        Transaction.TransactionType.RETAILER_TO_CUSTOMER
    );
}
    // ✅ Complete payment for transaction - FIXED VERSION
    @Transactional
    public Transaction completeTransactionPayment(Long transactionId, String razorpayPaymentId) {
        System.out.println("Completing payment for transaction: " + transactionId);
        
        Transaction transaction = getTransactionById(transactionId);
        
        transaction.setRazorpayPaymentId(razorpayPaymentId);
        transaction.setPaymentStatus(Transaction.PaymentStatus.PAID);
        transaction.setStatus(Transaction.TransactionStatus.COMPLETED);
        
        Transaction updatedTransaction = transactionRepository.save(transaction);
        System.out.println("Payment completed successfully for transaction: " + transactionId);
        
        return updatedTransaction;
    }

    // ✅ Update batch quantity after transaction
    private void updateBatchQuantity(Batch batch, Double purchasedQuantity) {
        double newAvailableQuantity = batch.getAvailableQuantity() - purchasedQuantity;
        batch.setAvailableQuantity(newAvailableQuantity);
        
        // Update batch status based on available quantity
        if (newAvailableQuantity <= 0) {
            batch.setStatus(Batch.BatchStatus.SOLD);
        } 
        
        batchRepository.save(batch);
        System.out.println("Batch quantity updated. New available: " + newAvailableQuantity);
    }

    // ✅ Get transactions for farmer
    public List<Transaction> getTransactionsForFarmer(Long farmerId) {
        return transactionRepository.findByFromUser_IdAndTransactionType(
            farmerId, 
            Transaction.TransactionType.FARMER_TO_DISTRIBUTOR
        );
    }

    // ✅ Get transactions for distributor
    public List<Transaction> getTransactionsForDistributor(Long distributorId) {
        return transactionRepository.findByToUser_IdAndTransactionType(
            distributorId, 
            Transaction.TransactionType.FARMER_TO_DISTRIBUTOR
        );
    }

    // ✅ Get pending payments by user
    public List<Transaction> getPendingPaymentsByUser(Long userId) {
        return transactionRepository.findByToUserIdAndPaymentStatus(userId, Transaction.PaymentStatus.PENDING);
    }

    // ✅ Get transactions by payment status
    public List<Transaction> getTransactionsByPaymentStatus(Transaction.PaymentStatus paymentStatus) {
        return transactionRepository.findByPaymentStatus(paymentStatus);
    }

    // ✅ Update transaction payment details
    @Transactional
    public Transaction updateTransactionPayment(Long transactionId, String razorpayOrderId, String razorpayPaymentId) {
        Transaction transaction = getTransactionById(transactionId);
        
        transaction.setRazorpayOrderId(razorpayOrderId);
        transaction.setRazorpayPaymentId(razorpayPaymentId);
        transaction.setPaymentStatus(Transaction.PaymentStatus.PAID);
        transaction.setStatus(Transaction.TransactionStatus.COMPLETED);
        
        return transactionRepository.save(transaction);
    }

    @Transactional
public Transaction updateTransactionDeliveryStatus(Long id, String deliveryStatus) {
    Transaction existing = getTransactionById(id);
    
    // Only update delivery status
    if (deliveryStatus != null) {
        try {
            existing.setDeliveryStatus(Transaction.DeliveryStatus.valueOf(deliveryStatus));
        } catch (IllegalArgumentException e) {
            throw new RuntimeException("Invalid delivery status: " + deliveryStatus);
        }
    }
    
    return transactionRepository.save(existing);
}

    // ========== EXISTING METHODS (keep these) ==========

    // Generic transaction creator
    private Transaction createTransactionInternal(Long batchId, Long fromUserId, Long toUserId, Double quantity, Double pricePerUnit, String unit, String remarks, Transaction.TransactionType type) {
        Batch batch = batchRepository.findById(batchId)
                .orElseThrow(() -> new RuntimeException("Batch not found"));

        User fromUser = userRepository.findById(fromUserId)
                .orElseThrow(() -> new RuntimeException("Sender not found"));

        User toUser = userRepository.findById(toUserId)
                .orElseThrow(() -> new RuntimeException("Receiver not found"));

        Transaction transaction = new Transaction();
        transaction.setBatch(batch);
        transaction.setFromUser(fromUser);
        transaction.setToUser(toUser);
        transaction.setQuantity(quantity);
        transaction.setUnit(unit);
        transaction.setPricePerUnit(pricePerUnit);
        transaction.setTotalAmount(quantity * pricePerUnit);
        transaction.setTransactionDate(LocalDateTime.now());
        transaction.setRemarks(remarks);

        transaction.setTransactionType(type);
        transaction.setStatus(Transaction.TransactionStatus.INITIATED);
        transaction.setPaymentStatus(Transaction.PaymentStatus.PENDING);
        transaction.setDeliveryStatus(Transaction.DeliveryStatus.PENDING);

        return transactionRepository.save(transaction);
    }

    // ✅ Farmer → Distributor
    public Transaction farmerToDistributor(Long batchId, Long farmerId, Long distributorId, Double quantity, Double pricePerUnit, String unit, String remarks) {
        return createTransactionInternal(batchId, farmerId, distributorId, quantity, pricePerUnit, unit, remarks, Transaction.TransactionType.FARMER_TO_DISTRIBUTOR);
    }

    // ✅ Distributor → Retailer
    public Transaction distributorToRetailer(Long batchId, Long distributorId, Long retailerId, Double quantity, Double pricePerUnit, String unit, String remarks) {
        return createTransactionInternal(batchId, distributorId, retailerId, quantity, pricePerUnit, unit, remarks, Transaction.TransactionType.DISTRIBUTOR_TO_RETAILER);
    }

    // ✅ Retailer → Customer
    public Transaction retailerToCustomer(Long batchId, Long retailerId, Long customerId, Double quantity, Double pricePerUnit, String unit, String remarks) {
        return createTransactionInternal(batchId, retailerId, customerId, quantity, pricePerUnit, unit, remarks, Transaction.TransactionType.RETAILER_TO_CUSTOMER);
    }

    // ✅ Get Transaction by ID
    public Transaction getTransactionById(Long id) {
        return transactionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Transaction not found with ID: " + id));
    }

    // ✅ Get All Transactions
    public List<Transaction> getAllTransactions() {
        return transactionRepository.findAll();
    }

    // ✅ Get Transactions by Sender
    public List<Transaction> getTransactionsByFromUser(Long userId) {
        return transactionRepository.findByFromUserId(userId);
    }

    // ✅ Get Transactions by Receiver
    public List<Transaction> getTransactionsByToUser(Long userId) {
        return transactionRepository.findByToUserId(userId);
    }

    // ✅ Get Transactions by Batch
    public List<Transaction> getTransactionsByBatch(Long batchId) {
        return transactionRepository.findByBatchId(batchId);
    }

    // ✅ Update Transaction Status
    @Transactional
    public Transaction updateTransaction(Long id, Transaction updated) {
        Transaction existing = getTransactionById(id);

        // Update all fields
        if (updated.getStatus() != null) existing.setStatus(updated.getStatus());
        if (updated.getPaymentStatus() != null) existing.setPaymentStatus(updated.getPaymentStatus());
        if (updated.getDeliveryStatus() != null) existing.setDeliveryStatus(updated.getDeliveryStatus());
        if (updated.getRemarks() != null) existing.setRemarks(updated.getRemarks());
        
        // Update quantity and recalculate total amount
        if (updated.getQuantity() != null && updated.getQuantity() > 0) {
            // Restore old quantity to batch first
            Batch batch = existing.getBatch();
            batch.setAvailableQuantity(batch.getAvailableQuantity() + existing.getQuantity());
            
            // Check if new quantity is available
            if (updated.getQuantity() > batch.getAvailableQuantity()) {
                throw new RuntimeException("Not enough quantity in batch. Available: " + batch.getAvailableQuantity());
            }
            
            // Deduct new quantity
            batch.setAvailableQuantity(batch.getAvailableQuantity() - updated.getQuantity());
            batchRepository.save(batch);
            
            existing.setQuantity(updated.getQuantity());
        }
        
        if (updated.getPricePerUnit() != null && updated.getPricePerUnit() >= 0) {
            existing.setPricePerUnit(updated.getPricePerUnit());
        }
        
        if (updated.getUnit() != null) {
            existing.setUnit(updated.getUnit());
        }
        
        // Recalculate total amount
        if (updated.getQuantity() != null || updated.getPricePerUnit() != null) {
            existing.setTotalAmount(existing.getQuantity() * existing.getPricePerUnit());
        }

        return transactionRepository.save(existing);
    }

    // ✅ Delete Transaction
    public void deleteTransaction(Long id) {
        transactionRepository.deleteById(id);
    }


    // Add these methods to your TransactionService class

// ✅ Get incoming orders from customers for retailer
public List<Transaction> getCustomerOrdersForRetailer(Long retailerId) {
    return transactionRepository.findByToUser_IdAndTransactionType(
        retailerId, 
        Transaction.TransactionType.RETAILER_TO_CUSTOMER
    );
}

// ✅ Get purchases from distributors for retailer
public List<Transaction> getDistributorPurchasesForRetailer(Long retailerId) {
    return transactionRepository.findByToUser_IdAndTransactionType(
        retailerId, 
        Transaction.TransactionType.DISTRIBUTOR_TO_RETAILER
    );
}

// ✅ Get paid purchases from distributors (available stock)
public List<Transaction> getPaidPurchasesFromDistributors(Long distId) {
    return transactionRepository.findByToUser_IdAndTransactionTypeAndPaymentStatus(
        distId, 
        Transaction.TransactionType.FARMER_TO_DISTRIBUTOR,
        Transaction.PaymentStatus.PAID,
        Transaction.DeliveryStatus.DELIVERED
    );
}

// ✅ Get sales to customers made by retailer
public List<Transaction> getSalesToCustomersByRetailer(Long retailerId) {
    return transactionRepository.findByFromUser_IdAndTransactionType(
        retailerId, 
        Transaction.TransactionType.RETAILER_TO_CUSTOMER
    );
}

// ✅ Get paid and delivered purchases (retailer can sell these to customers)
public List<Transaction> getPaidAndDeliveredPurchases(Long retailerId) {
    return transactionRepository.findByToUser_IdAndTransactionTypeAndPaymentStatusAndDeliveryStatus(
        retailerId,
        Transaction.TransactionType.DISTRIBUTOR_TO_RETAILER,
        Transaction.PaymentStatus.PAID,
        Transaction.DeliveryStatus.DELIVERED
    );
}

// ✅ Get all available distributor stocks (paid and delivered, any retailer can buy)
public List<Transaction> getAvailableDistributorStocks() {
    return transactionRepository.findByTransactionTypeAndPaymentStatusAndDeliveryStatus(
        Transaction.TransactionType.DISTRIBUTOR_TO_RETAILER,
        Transaction.PaymentStatus.PAID,
        Transaction.DeliveryStatus.DELIVERED
    );
}

 public Long getToUserIdByTransactionId(Long transactionId) {
        return transactionRepository.findToUserIdByTransactionId(transactionId)
            .orElseThrow(() -> new RuntimeException("Transaction not found with ID: " + transactionId));
}


}
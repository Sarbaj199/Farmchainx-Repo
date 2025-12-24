package com.example.backend.controller;


import com.example.backend.dto.TransactionRequestDTO;
import com.example.backend.entity.Transaction;
import com.example.backend.service.PaymentService;
import com.example.backend.service.TransactionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/payment")
public class PaymentController {

    @Autowired
    private PaymentService paymentService;

    @Autowired
    private TransactionService transactionService;

    /**
     * Create Razorpay order
     */
    @PostMapping("/create-order")
    public ResponseEntity<?> createRazorpayOrder(@RequestBody Map<String, Object> request) {
        try {
            Double amount = Double.parseDouble(request.get("amount").toString());
            String currency = request.getOrDefault("currency", "INR").toString();
            String receipt = request.getOrDefault("receipt", "receipt_" + System.currentTimeMillis()).toString();

            var order = paymentService.createRazorpayOrder(amount, currency, receipt);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("order", order);
            response.put("razorpayKey", "YOUR_RAZORPAY_KEY_ID"); // You might want to fetch this from config
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(errorResponse);
        }
    }

    /**
     * Verify payment and complete transaction
     */
    @PostMapping("/verify")
    public ResponseEntity<?> verifyPayment(@RequestBody Map<String, String> request) {
        try {
            Long transactionId = Long.parseLong(request.get("transactionId"));
            String razorpayOrderId = request.get("razorpayOrderId");
            String razorpayPaymentId = request.get("razorpayPaymentId");
            String razorpaySignature = request.get("razorpaySignature");

            Transaction transaction = paymentService.verifyAndCompletePayment(
                transactionId, razorpayOrderId, razorpayPaymentId, razorpaySignature
            );

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Payment verified successfully");
            response.put("transaction", transaction);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(errorResponse);
        }
    }

    /**
     * Complete payment for pending transaction
     */
    @PostMapping("/complete-pending")
    public ResponseEntity<?> completePendingPayment(@RequestBody Map<String, Object> request) {
        try {
            Long transactionId = Long.parseLong(request.get("transactionId").toString());
            String razorpayOrderId = request.get("razorpayOrderId").toString();
            String razorpayPaymentId = request.get("razorpayPaymentId").toString();

            Transaction transaction = paymentService.completePendingPayment(
                transactionId, razorpayOrderId, razorpayPaymentId
            );

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Payment completed successfully");
            response.put("transaction", transaction);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(errorResponse);
        }
    }

    /**
     * Create transaction with immediate payment
     */
    @PostMapping("/create-with-payment")
    public ResponseEntity<?> createTransactionWithPayment(@RequestBody TransactionRequestDTO request) {
        try {
            Transaction transaction = paymentService.createTransactionWithPayment(
                request.getBatchId(),
                request.getFromUserId(),
                request.getToUserId(),
                request.getQuantity(),
                request.getPricePerUnit(),
                request.getUnit(),
                request.getRemarks(),
                request.getTransactionType()
            );

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Transaction created with payment order");
            response.put("transaction", transaction);
            response.put("razorpayOrderId", transaction.getRazorpayOrderId());
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(errorResponse);
        }
    }

    /**
     * Create transaction with pay-later option
     */
    @PostMapping("/create-pay-later")
    public ResponseEntity<?> createTransactionPayLater(@RequestBody TransactionRequestDTO request) {
        try {
            Transaction transaction = paymentService.createTransactionPayLater(
                request.getBatchId(),
                request.getFromUserId(),
                request.getToUserId(),
                request.getQuantity(),
                request.getPricePerUnit(),
                request.getUnit(),
                request.getRemarks(),
                request.getTransactionType()
            );

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Transaction created with pay-later option");
            response.put("transaction", transaction);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(errorResponse);
        }
    }

    /**
     * Get pending payments for current user
     */
    @GetMapping("/pending/{userId}")
    public ResponseEntity<?> getPendingPayments(@PathVariable Long userId) {
        try {
            List<Transaction> pendingTransactions = paymentService.getPendingPaymentsByUser(userId);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("pendingTransactions", pendingTransactions);
            response.put("count", pendingTransactions.size());
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(errorResponse);
        }
    }

    /**
     * Get payment status for a transaction
     */
    @GetMapping("/status/{transactionId}")
    public ResponseEntity<?> getPaymentStatus(@PathVariable Long transactionId) {
        try {
            Transaction transaction = transactionService.getTransactionById(transactionId);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("transactionId", transactionId);
            response.put("paymentStatus", transaction.getPaymentStatus());
            response.put("razorpayOrderId", transaction.getRazorpayOrderId());
            response.put("razorpayPaymentId", transaction.getRazorpayPaymentId());
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(errorResponse);
        }
    }

   
}
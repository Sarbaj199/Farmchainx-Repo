package com.example.backend.controller;

import com.example.backend.dto.CompletePaymentRequest;
import com.example.backend.dto.TransactionRequestDTO;
import com.example.backend.entity.Transaction;
import com.example.backend.service.TransactionService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/transactions")
@CrossOrigin(origins = "*")
public class TransactionController {

    @Autowired
    private TransactionService transactionService;

    // ✅ Create transaction with payment options - FIXED VERSION
    @PostMapping("/create")
    public ResponseEntity<?> createTransaction(@RequestBody TransactionRequestDTO request) {
        try {
            System.out.println("Received transaction request: " + request);
            
            boolean payNow = request.getPayNow() != null ? request.getPayNow() : false;
            String razorpayOrderId = request.getRazorpayOrderId();
            
            // Validate required fields
            if (request.getFromUserId() == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "Farmer ID (fromUserId) is required"));
            }
            if (request.getToUserId() == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "Distributor ID (toUserId) is required"));
            }
            if (request.getBatchId() == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "Batch ID is required"));
            }

            Transaction transaction = transactionService.createTransactionWithPaymentOption(
                request.getBatchId(),
                request.getFromUserId(),
                request.getToUserId(),
                request.getQuantity(),
                request.getPricePerUnit(),
                request.getUnit() != null ? request.getUnit() : "kg",
                request.getRemarks(),
                request.getTransactionType(),
                payNow,
                razorpayOrderId
            );

            return ResponseEntity.ok(transaction);
            
        } catch (Exception e) {
            System.err.println("Error creating transaction: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // ✅ Complete payment - FIXED VERSION
    @PostMapping("/complete-payment")
    public ResponseEntity<?> completePayment(@RequestBody CompletePaymentRequest request) {
        try {
            System.out.println("Completing payment for transaction: " + request.getTransactionId());
            
            if (request.getTransactionId() == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "Transaction ID is required"));
            }
            if (request.getRazorpayPaymentId() == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "Payment ID is required"));
            }

            Transaction transaction = transactionService.completeTransactionPayment(
                request.getTransactionId(),
                request.getRazorpayPaymentId()
            );

            return ResponseEntity.ok(transaction);
            
        } catch (Exception e) {
            System.err.println("Error completing payment: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // ✅ Get farmer transactions
    @GetMapping("/farmer/{farmerId}")
    public ResponseEntity<List<Transaction>> getFarmerTransactions(@PathVariable Long farmerId) {
        List<Transaction> transactions = transactionService.getTransactionsForFarmer(farmerId);
        return ResponseEntity.ok(transactions);
    }

    // ✅ Get distributor transactions
    @GetMapping("/distributor/{distributorId}")
    public ResponseEntity<List<Transaction>> getDistributorTransactions(@PathVariable Long distributorId) {
        List<Transaction> transactions = transactionService.getTransactionsForDistributor(distributorId);
        return ResponseEntity.ok(transactions);
    }

    // ✅ Get retailer transactions
@GetMapping("/retailer/{retailerId}")
public ResponseEntity<List<Transaction>> getRetailerTransactions(@PathVariable Long retailerId) {
    List<Transaction> transactions = transactionService.getTransactionsForRetailer(retailerId);
    return ResponseEntity.ok(transactions);
}

// ✅ Get customer transactions  
@GetMapping("/customer/{customerId}")
public ResponseEntity<List<Transaction>> getCustomerTransactions(@PathVariable Long customerId) {
    List<Transaction> transactions = transactionService.getTransactionsForCustomer(customerId);
    return ResponseEntity.ok(transactions);
}

    // ✅ Get pending payments for user
    @GetMapping("/pending/{userId}")
    public ResponseEntity<List<Transaction>> getPendingPayments(@PathVariable Long userId) {
        List<Transaction> transactions = transactionService.getPendingPaymentsByUser(userId);
        return ResponseEntity.ok(transactions);
    }

    // ========== EXISTING ENDPOINTS (keep these) ==========

    // ✅ Farmer → Distributor
    @PostMapping("/farmer-to-distributor")
    public ResponseEntity<Transaction> farmerToDistributor(@RequestBody TransactionRequestDTO dto) {
        return ResponseEntity.ok(
            transactionService.farmerToDistributor(dto.getBatchId(), dto.getFromUserId(), dto.getToUserId(),
                                                   dto.getQuantity(), dto.getPricePerUnit(), dto.getUnit(), dto.getRemarks())
        );
    }

    // ✅ Distributor → Retailer
    @PostMapping("/distributor-to-retailer")
    public ResponseEntity<Transaction> distributorToRetailer(@RequestBody TransactionRequestDTO dto) {
        return ResponseEntity.ok(
            transactionService.distributorToRetailer(dto.getBatchId(), dto.getFromUserId(), dto.getToUserId(),
                                                     dto.getQuantity(), dto.getPricePerUnit(), dto.getUnit(), dto.getRemarks())
        );
    }

    // ✅ Get All Transactions
    @GetMapping("/get-all")
    public ResponseEntity<List<Transaction>> getAllTransactions() {
        return ResponseEntity.ok(transactionService.getAllTransactions());
    }

    // ✅ Get Transaction by ID
    @GetMapping("/{id}")
    public ResponseEntity<Transaction> getTransactionById(@PathVariable Long id) {
        return ResponseEntity.ok(transactionService.getTransactionById(id));
    }

    // ✅ Get by Sender
    @GetMapping("/from/{userId}")
    public ResponseEntity<List<Transaction>> getByFromUser(@PathVariable Long userId) {
        return ResponseEntity.ok(transactionService.getTransactionsByFromUser(userId));
    }

    // ✅ Get by Receiver
    @GetMapping("/to/{userId}")
    public ResponseEntity<List<Transaction>> getByToUser(@PathVariable Long userId) {
        return ResponseEntity.ok(transactionService.getTransactionsByToUser(userId));
    }

    // ✅ Get by Batch
    @GetMapping("/batch/{batchId}")
    public ResponseEntity<List<Transaction>> getByBatch(@PathVariable Long batchId) {
        return ResponseEntity.ok(transactionService.getTransactionsByBatch(batchId));
    }

    // ✅ Update Status
    @PutMapping("/{id}/status")
    public ResponseEntity<Transaction> updateTransactionStatus(@PathVariable Long id, @RequestBody Transaction updated) {
        return ResponseEntity.ok(transactionService.updateTransaction(id, updated));
    }

    // ✅ Delete
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTransaction(@PathVariable Long id) {
        transactionService.deleteTransaction(id);
        return ResponseEntity.ok().build();
    }


    // ✅ Get farmer's own transactions (both sent and received)
@GetMapping("/my-transactions")
public ResponseEntity<?> getMyTransactions(@RequestHeader("Authorization") String token) {
    try {
        // Extract user ID from token (you'll need to implement this)
        Long userId = extractUserIdFromToken(token);
        if (userId == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Invalid token"));
        }

        // Get transactions where user is either sender or receiver
        List<Transaction> sentTransactions = transactionService.getTransactionsByFromUser(userId);
        List<Transaction> receivedTransactions = transactionService.getTransactionsByToUser(userId);
        
        // Combine and return
        List<Transaction> allTransactions = new ArrayList<>();
        allTransactions.addAll(sentTransactions);
        allTransactions.addAll(receivedTransactions);
        
        return ResponseEntity.ok(allTransactions);
    } catch (Exception e) {
        return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
    }
}

// ✅ Farmer update delivery status (specific endpoint for farmers)
@PutMapping("/{id}/delivery-status")
public ResponseEntity<?> updateDeliveryStatus(
        @PathVariable Long id, 
        @RequestBody Map<String, String> request,
        @RequestHeader("Authorization") String token) {
    try {
        // Extract user ID from token
        Long userId = extractUserIdFromToken(token);
        if (userId == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Invalid token"));
        }

        String deliveryStatus = request.get("deliveryStatus");
        if (deliveryStatus == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Delivery status is required"));
        }

        // Verify the farmer owns this transaction (is the sender)
        Transaction transaction = transactionService.getTransactionById(id);
        if (!transaction.getFromUser().getId().equals(userId)) {
            return ResponseEntity.status(403).body(Map.of("error", "You can only update delivery status for your own transactions"));
        }

        // Update only the delivery status
        transaction.setDeliveryStatus(Transaction.DeliveryStatus.valueOf(deliveryStatus));
        Transaction updatedTransaction = transactionService.updateTransaction(id, transaction);

        return ResponseEntity.ok(updatedTransaction);
    } catch (Exception e) {
        return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
    }
}

// Helper method to extract user ID from token
private Long extractUserIdFromToken(String token) {
    try {
        // Remove "Bearer " prefix if present
        if (token.startsWith("Bearer ")) {
            token = token.substring(7);
        }
        
        // Decode JWT token and extract user ID
        // This is a simplified version - you should use your actual JWT parsing logic
        String[] parts = token.split("\\.");
        if (parts.length < 2) return null;
        
        String payload = new String(java.util.Base64.getDecoder().decode(parts[1]));
        ObjectMapper mapper = new ObjectMapper();
        JsonNode jsonNode = mapper.readTree(payload);
        
        return jsonNode.has("userId") ? jsonNode.get("userId").asLong() : null;
    } catch (Exception e) {
        return null;
    }
}

// Add these endpoints to your TransactionController

// ✅ Get purchases from distributors (where retailer is receiver)
@GetMapping("/retailer/{retailerId}/from-distributors")
public ResponseEntity<List<Transaction>> getPurchasesFromDistributors(@PathVariable Long retailerId) {
    List<Transaction> purchases = transactionService.getDistributorPurchasesForRetailer(retailerId);
    return ResponseEntity.ok(purchases);
}

// ✅ Get sales to customers (where retailer is sender)
@GetMapping("/retailer/{retailerId}/to-customers")
public ResponseEntity<List<Transaction>> getSalesToCustomers(@PathVariable Long retailerId) {
    List<Transaction> sales = transactionService.getSalesToCustomersByRetailer(retailerId);
    return ResponseEntity.ok(sales);
}

// ✅ Get paid purchases (available stock for selling to customers)
@GetMapping("/distributor/{distributorId}/available-transactions-for-batches")
public ResponseEntity<List<Transaction>> getAvailableStock(@PathVariable Long distributorId) {
    List<Transaction> stock = transactionService.getPaidPurchasesFromDistributors(distributorId);
    return ResponseEntity.ok(stock);
}

// ✅ Create sale to customer (retailer selling to customer)
@PostMapping("/retailer-to-customer")
public ResponseEntity<Transaction> createSaleToCustomer(@RequestBody TransactionRequestDTO dto) {
    return ResponseEntity.ok(
        transactionService.retailerToCustomer(dto.getBatchId(), dto.getFromUserId(), dto.getToUserId(),
                                            dto.getQuantity(), dto.getPricePerUnit(), dto.getUnit(), dto.getRemarks())
    );
}


// ✅ Get paid and delivered purchases (for retailer to sell to customers)
@GetMapping("/retailer/{retailerId}/sellable-stock")
public ResponseEntity<List<Transaction>> getSellableStock(@PathVariable Long retailerId) {
    List<Transaction> stock = transactionService.getPaidAndDeliveredPurchases(retailerId);
    return ResponseEntity.ok(stock);
}

// ✅ Get customer orders for retailer (where customer paid, retailer needs to deliver)
@GetMapping("/retailer/{retailerId}/customer-orders")
public ResponseEntity<List<Transaction>> getCustomerOrders(@PathVariable Long retailerId) {
    List<Transaction> orders = transactionService.getCustomerOrdersForRetailer(retailerId);
    return ResponseEntity.ok(orders);
}

// ✅ Update delivery status for customer orders
@PutMapping("/{id}/customer-delivery-status")
public ResponseEntity<?> updateCustomerDeliveryStatus(
        @PathVariable Long id, 
        @RequestBody Map<String, String> request,
        @RequestHeader("Authorization") String token) {
    try {
        Long userId = extractUserIdFromToken(token);
        if (userId == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Invalid token"));
        }

        String deliveryStatus = request.get("deliveryStatus");
        if (deliveryStatus == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Delivery status is required"));
        }

        // Verify the retailer owns this transaction (is the receiver for customer orders)
        Transaction transaction = transactionService.getTransactionById(id);
        if (!transaction.getToUser().getId().equals(userId)) {
            return ResponseEntity.status(403).body(Map.of("error", "You can only update delivery status for orders received by you"));
        }

        Transaction updatedTransaction = transactionService.updateTransactionDeliveryStatus(id, deliveryStatus);
        return ResponseEntity.ok(updatedTransaction);
    } catch (Exception e) {
        return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
    }
}

// ✅ Get all available stocks from distributors (any retailer can purchase)
@GetMapping("/available-stocks")
public ResponseEntity<List<Transaction>> getAvailableStocks() {
    List<Transaction> stocks = transactionService.getAvailableDistributorStocks();
    return ResponseEntity.ok(stocks);
}

// ✅ Create purchase from available stock (retailer buying from distributor)
@PostMapping("/purchase-from-stock")
public ResponseEntity<?> purchaseFromStock(@RequestBody TransactionRequestDTO request) {
    try {
        Transaction transaction = transactionService.createTransactionWithPaymentOption(
            request.getBatchId(),
            request.getFromUserId(),
            request.getToUserId(),
            request.getQuantity(),
            request.getPricePerUnit(),
            request.getUnit() != null ? request.getUnit() : "kg",
            request.getRemarks(),
            Transaction.TransactionType.DISTRIBUTOR_TO_RETAILER,
            request.getPayNow() != null ? request.getPayNow() : false,
            request.getRazorpayOrderId()
        );
        return ResponseEntity.ok(transaction);
    } catch (Exception e) {
        return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
    }
}


@GetMapping("/{transactionId}/to-user-id")
    public ResponseEntity<Long> getToUserId(@PathVariable Long transactionId) {
        try {
            Long toUserId = transactionService.getToUserIdByTransactionId(transactionId);
            
            return ResponseEntity.ok(toUserId);
            
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(null);
        }
    }

}
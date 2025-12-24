package com.example.backend.dto;

import com.example.backend.entity.Transaction;
import lombok.Data;

@Data
public class TransactionRequestDTO {
    private Long batchId;
    private Long fromUserId;
    private Long toUserId;
    private Double quantity;
    private Double pricePerUnit;
    private String unit;
    private String remarks;
    private Transaction.TransactionType transactionType;
    
    // New fields for payment functionality
    private Boolean payNow;
    private String razorpayOrderId;
    private String paymentMethod; // RAZORPAY, PAY_LATER, etc.
}
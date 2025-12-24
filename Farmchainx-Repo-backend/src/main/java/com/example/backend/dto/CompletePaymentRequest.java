package com.example.backend.dto;

import lombok.Data;

@Data
public class CompletePaymentRequest {
    private Long transactionId;
    private String razorpayPaymentId;
    private String razorpayOrderId; // Add this field
}
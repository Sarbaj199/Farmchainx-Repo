package com.example.backend.dto;
import lombok.*;

@Data
public class PaymentVerificationDTO {
    private String razorpayOrderId;
    private String razorpayPaymentId;
    private String razorpaySignature;
    private Long transactionId;
}
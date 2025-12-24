package com.example.backend.dto;
import lombok.*;

@Data
public class PaymentRequestDTO {
    private Long transactionId;
    private Double amount;
    private String currency;
}


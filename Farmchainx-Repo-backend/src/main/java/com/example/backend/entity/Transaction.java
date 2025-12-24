package com.example.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@Entity
@Table(name = "transactions")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Transaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long transactionId;

    @Enumerated(EnumType.STRING)
    private com.example.backend.entity.Transaction.TransactionType transactionType; // Full package

    private LocalDateTime transactionDate;

    private Double quantity;
    private String unit;
    private Double pricePerUnit;
    private Double totalAmount;

    @Enumerated(EnumType.STRING)
    private com.example.backend.entity.Transaction.TransactionStatus status; // Full package

    @Enumerated(EnumType.STRING)
    private com.example.backend.entity.Transaction.PaymentStatus paymentStatus; // Full package

    @Enumerated(EnumType.STRING)
    private com.example.backend.entity.Transaction.DeliveryStatus deliveryStatus; // Full package

    private String remarks;

    private String razorpayOrderId;
    private String razorpayPaymentId;
    
    @ManyToOne
    @JsonIgnoreProperties({"transactions"})
    @JoinColumn(name = "batch_id", nullable = false)
    private Batch batch;

    @ManyToOne
    @JoinColumn(name = "from_user_id", nullable = false)
    @JsonIgnore
    private User fromUser;

    @ManyToOne
    @JoinColumn(name = "to_user_id", nullable = false)
    @JsonIgnore
    private User toUser;

    // Enums remain the same
    public enum TransactionType {
        FARMER_TO_DISTRIBUTOR,
        DISTRIBUTOR_TO_RETAILER,
        RETAILER_TO_CUSTOMER
    }

    public enum TransactionStatus {
        INITIATED,
        IN_TRANSIT,
        COMPLETED,
        CANCELLED,
        PENDING_PAYMENT
    }

    public enum PaymentStatus {
        PENDING,
        PAID,
        FAILED
    }

    public enum DeliveryStatus {
        PENDING,
        IN_TRANSIT,
        DELIVERED
    }
}
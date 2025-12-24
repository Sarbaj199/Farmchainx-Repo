package com.example.backend.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.time.LocalDateTime;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@Entity
@Table(name = "reviews")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Review {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long reviewId;

    @Column(nullable = false)
    private Integer rating; // 1-5 stars

    @Column(columnDefinition = "TEXT")
    private String comment;

    private LocalDateTime createdAt;

    // Link to Crop
    @ManyToOne
    @JsonIgnoreProperties({"reviews", "batches", "farmer", "transactions"})
    @JoinColumn(name = "crop_id")
    private Crop crop;
    
    // Link to User who wrote the review
    @ManyToOne
    @JoinColumn(name = "user_id")
    @JsonIgnoreProperties({"reviews", "crops", "transactions", "passwordHash"})
    private User user;

    @OneToOne
    @JoinColumn(name = "transaction_id")
    @JsonIgnoreProperties({"review", "batch", "toUser", "fromUser"})
    private Transaction transaction;

    // Optional: Store reviewer name separately for easy display
    private String reviewerName;
}
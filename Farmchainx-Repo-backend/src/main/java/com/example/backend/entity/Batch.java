package com.example.backend.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.time.LocalDateTime;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@Entity
@Table(name = "batches")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Batch {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long batchId;

    private String batchNumber;
    private LocalDateTime harvestDate;
    private Double quantity;
    private String unit;
    private String storageConditions;
    private Double price;
    private Double pricePerUnit;

    @Column(columnDefinition = "TEXT")
    private String qrCode;

    // Link to Crop
    @ManyToOne
    @JsonIgnoreProperties({"batches"}) 
    @JoinColumn(name = "crop_id", nullable = false)
    private Crop crop;

    // ✅ CHANGE: Link to User instead of Farmer
    @ManyToOne
    @JoinColumn(name = "user_id")
    private User user;

    // ✅ ADD: Track which user role created this batch
    @Enumerated(EnumType.STRING)
    private BatchCreatorRole createdByRole;

    // Link to Transactions
    @OneToMany(mappedBy = "batch", cascade = CascadeType.ALL)
    @JsonIgnoreProperties("batch")
    private List<Transaction> transactions;

    public enum BatchStatus {
        AVAILABLE,
        RESERVED,
        SOLD,
        EXPIRED
    }

    @Enumerated(EnumType.STRING)
    private BatchStatus status = BatchStatus.AVAILABLE;

    private Double availableQuantity;

    // ✅ ADD: Enum for batch creator roles
    public enum BatchCreatorRole {
        FARMER,
        DISTRIBUTOR,
        RETAILER
    }

    @PrePersist
    public void setDefaults() {
        if (this.status == null) {
            this.status = BatchStatus.AVAILABLE;
        }
        if (this.availableQuantity == null && this.quantity != null) {
            this.availableQuantity = this.quantity;
        }
        if (this.pricePerUnit == null && this.price != null && this.quantity != null && this.quantity > 0) {
            this.pricePerUnit = this.price / this.quantity;
        }
        if (this.createdByRole == null) {
            this.createdByRole = BatchCreatorRole.FARMER;
        }
    }
}
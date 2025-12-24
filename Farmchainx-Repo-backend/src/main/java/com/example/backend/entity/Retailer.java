package com.example.backend.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.util.List;

@Entity
@Table(name = "retailers")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Retailer {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long retailerId;

    @OneToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    private String businessName;
    private String businessLicense;
    private String storageCapacity;
    private String operatingArea;
    private Boolean isVerified = false;

    // @OneToMany(mappedBy = "retailer", cascade = CascadeType.ALL)
    // private List<Transaction> transactions;
}
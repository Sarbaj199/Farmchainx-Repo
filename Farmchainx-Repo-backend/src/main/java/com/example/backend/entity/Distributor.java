package com.example.backend.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.util.List;

@Entity
@Table(name = "distributors")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Distributor {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long distributorId;

    @OneToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    private String companyName;
    private String transportType;
    private String coverageArea;
    private String warehouseCapacity;
    private String licenseNumber;
    private String contactNumber;
    private Boolean isVerified = false;

}
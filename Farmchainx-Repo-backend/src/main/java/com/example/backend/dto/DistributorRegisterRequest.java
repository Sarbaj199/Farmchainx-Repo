package com.example.backend.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DistributorRegisterRequest {
    // User details
    private String username;
    private String password;
    private String name;
    private String email;
    private String phone;
    private String address;

    private String companyName;
    private String transportType;
    private String coverageArea;
    private String warehouseCapacity;
    private String licenseNumber;
}

package com.example.backend.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RetailerRegisterRequest {
    // User details
    private String username;
    private String password;
    private String name;
    private String email;
    private String phone;
    private String address;

    private String businessName;
    private String businessLicense;
    private String storageCapacity;
    private String operatingArea;
    
}

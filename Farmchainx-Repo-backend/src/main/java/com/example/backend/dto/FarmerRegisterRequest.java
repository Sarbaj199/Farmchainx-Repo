package com.example.backend.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class FarmerRegisterRequest {
    // User details
    private String username;
    private String password;
    private String name;
    private String email;
    private String phone;
    private String address;
    private String farmName;
    private String farmLocation;
    private String farmSize;
    // private String certifications;  // Comma-separated list of certifications
}

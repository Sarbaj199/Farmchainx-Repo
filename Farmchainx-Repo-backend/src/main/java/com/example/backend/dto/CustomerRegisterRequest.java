package com.example.backend.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CustomerRegisterRequest {
    // User details
    private String username;
    private String password;
    private String name;
    private String email;
    private String phone;
    private String address;
    // Customer specific details
    private String deliveryAddress; // Preferred delivery address if different from main address
}

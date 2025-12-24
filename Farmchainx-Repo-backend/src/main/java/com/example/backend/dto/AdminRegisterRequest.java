package com.example.backend.dto;

import lombok.Data;

@Data
public class AdminRegisterRequest {
    private String username;
    private String email;
    private String password;
    private String phone;
    private String name;
    private String address;
    private String department;
    private String adminLevel;
}

package com.example.backend.dto;

import lombok.Data;

@Data
public class AdminStatsResponse {
    private long totalUsers;
    private long farmerCount;
    private long distributorCount;
    private long retailerCount;
    private long customerCount;

    private long approvedUsers;
    private long pendingUsers;
    private long rejectedUsers; // Add this field
}
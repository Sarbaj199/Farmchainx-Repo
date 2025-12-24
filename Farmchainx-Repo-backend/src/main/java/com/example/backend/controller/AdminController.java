package com.example.backend.controller;
import com.example.backend.dto.AdminStatsResponse;
import com.example.backend.entity.Admin;
import com.example.backend.entity.User;
import com.example.backend.service.AdminService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/admin")
public class AdminController {

    @Autowired
    private AdminService adminService;

    @PostMapping
    public ResponseEntity<Admin> createAdmin(@RequestBody Admin admin) {
        return ResponseEntity.ok(adminService.createAdmin(admin));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Admin> getAdmin(@PathVariable Long id) {
        return ResponseEntity.ok(adminService.getAdminById(id));
    }

    @GetMapping("/get/admins")
    public ResponseEntity<List<Admin>> getAllAdmins() {
        return ResponseEntity.ok(adminService.getAllAdmins());
    }

    @PutMapping("/{id}")
    public ResponseEntity<Admin> updateAdmin(@PathVariable Long id, @RequestBody Admin admin) {
        admin.setAdminId(id);
        return ResponseEntity.ok(adminService.updateAdmin(admin));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteAdmin(@PathVariable Long id) {
        adminService.deleteAdmin(id);
        return ResponseEntity.ok().build();
    }

    @PutMapping("/approve/farmer/{id}")
    public ResponseEntity<String> approveFarmer(@PathVariable Long id) {
        adminService.approveFarmer(id);
        return ResponseEntity.ok("Farmer approved successfully");
    }
    @PutMapping("/reject/farmer/{id}")
    public ResponseEntity<String> rejectFarmer(@PathVariable Long id) {
        adminService.rejectFarmer(id);
        return ResponseEntity.ok("Farmer rejected successfully");
    }
    @PutMapping("/reject/distributor/{id}")
    public ResponseEntity<String> rejectDistributor(@PathVariable Long id) {
        adminService.rejectDistributor(id);
        return ResponseEntity.ok("Distributor rejected successfully");
    }
    @PutMapping("/reject/retailer/{id}")
public ResponseEntity<String> rejectRetailer(@PathVariable Long id) {
    adminService.rejectRetailer(id);
    return ResponseEntity.ok("Retailer rejected successfully");
}
@GetMapping("/get/business-users")
public ResponseEntity<List<Map<String, Object>>> getAllBusinessUsersWithVerification() {
    List<Map<String, Object>> businessUsers = adminService.getAllBusinessUsersWithVerification();
    return ResponseEntity.ok(businessUsers);
}
    @GetMapping("/get/users")
public ResponseEntity<List<User>> getAllUsers() {
    return ResponseEntity.ok(adminService.getAllUsers());
}

    @PutMapping("/approve/distributor/{id}")
    public ResponseEntity<String> approveDistributor(@PathVariable Long id) {
        adminService.approveDistributor(id);
        return ResponseEntity.ok("Distributor approved successfully");
    }

    @PutMapping("/approve/retailer/{id}")
    public ResponseEntity<String> approveRetailer(@PathVariable Long id) {
        adminService.approveRetailer(id);
        return ResponseEntity.ok("Retailer approved successfully");
    }


        @GetMapping("/farmer/by-user/{userId}")
    public ResponseEntity<Map<String, Object>> getFarmerByUserId(@PathVariable Long userId) {
        try {
            Long farmerId = adminService.getFarmerIdByUserId(userId);
            
            Map<String, Object> response = new HashMap<>();
            response.put("farmerId", farmerId);
            response.put("success", true);
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "Farmer not found");
            errorResponse.put("message", e.getMessage());
            errorResponse.put("success", false);
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(errorResponse);
        }
    }
    
    @GetMapping("/distributor/by-user/{userId}")
    public ResponseEntity<Map<String, Object>> getDistributorByUserId(@PathVariable Long userId) {
        try {
            Long distributorId = adminService.getDistributorIdByUserId(userId);
            
            Map<String, Object> response = new HashMap<>();
            response.put("distributorId", distributorId);
            response.put("success", true);
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "Distributor not found");
            errorResponse.put("message", e.getMessage());
            errorResponse.put("success", false);
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(errorResponse);
        }
    }
    
    @GetMapping("/retailer/by-user/{userId}")
    public ResponseEntity<Map<String, Object>> getRetailerByUserId(@PathVariable Long userId) {
        try {
            Long retailerId = adminService.getRetailerIdByUserId(userId);
            
            Map<String, Object> response = new HashMap<>();
            response.put("retailerId", retailerId);
            response.put("success", true);
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "Retailer not found");
            errorResponse.put("message", e.getMessage());
            errorResponse.put("success", false);
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(errorResponse);
        }
    }

    @GetMapping("/stats")
    public ResponseEntity<AdminStatsResponse> getPlatformStats() {
        return ResponseEntity.ok(adminService.getPlatformStats());
    }
}
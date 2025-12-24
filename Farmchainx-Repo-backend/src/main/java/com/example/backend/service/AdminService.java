package com.example.backend.service;

import com.example.backend.dto.AdminStatsResponse;
import com.example.backend.entity.Admin;
import com.example.backend.entity.Farmer;
import com.example.backend.entity.Distributor;
import com.example.backend.entity.Retailer;
import com.example.backend.entity.Role;
import com.example.backend.entity.User;
import com.example.backend.repository.AdminRepository;
import com.example.backend.repository.DistributorRepository;
import com.example.backend.repository.FarmerRepository;
import com.example.backend.repository.RetailerRepository;
import com.example.backend.repository.UserRepository;

import jakarta.persistence.EntityNotFoundException;
import lombok.experimental.PackagePrivate;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
public class AdminService {
    
    @Autowired
    private AdminRepository adminRepository;

    @Autowired
    private FarmerRepository farmerRepository;

    @Autowired
    private DistributorRepository distributorRepository;
    
    @Autowired
    private RetailerRepository retailerRepository;

    @Autowired
    private FarmerService farmerService;
    
    @Autowired
    private DistributorService distributorService;
    
    @Autowired
    private RetailerService retailerService;

    @Autowired
    private UserRepository userRepository;

    public Admin createAdmin(Admin admin) {
        return adminRepository.save(admin);
    }

    public Admin getAdminById(Long id) {
        return adminRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Admin not found"));
    }

    public List<Admin> getAllAdmins() {
        return adminRepository.findAll();
    }

    public Admin updateAdmin(Admin admin) {
        getAdminById(admin.getAdminId()); // Check if exists
        return adminRepository.save(admin);
    }

    public void deleteAdmin(Long id) {
        adminRepository.deleteById(id);
    }

    public void approveFarmer(Long farmerId) {
        Farmer farmer = farmerService.getFarmerById(farmerId);
        farmer.setIsVerified(true);
        farmerService.updateFarmer(farmer);
    }

    public void approveDistributor(Long distributorId) {
        Distributor distributor = distributorService.getDistributorById(distributorId);
        distributor.setIsVerified(true);
        distributorService.updateDistributor(distributor);
    }

    public void approveRetailer(Long retailerId) {
        Retailer retailer = retailerService.getRetailerById(retailerId);
        retailer.setIsVerified(true);
        retailerService.updateRetailer(retailer);
    }
    public List<User> getAllUsers() {
    return userRepository.findAll();
}

    public String rejectFarmer(Long id) {
    Farmer farmer = farmerRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Farmer not found"));

    farmer.setIsVerified(null);
    farmerRepository.save(farmer);

    return "Farmer rejected successfully";
    }

    public String rejectDistributor(Long id) {
        Distributor distributor = distributorRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Distributor not found"));

        distributor.setIsVerified(null);
        distributorRepository.save(distributor);

        return "Distributor rejected successfully";
    }

     public String rejectRetailer(Long id) {
    Retailer retailer = retailerRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Retailer not found"));

    retailer.setIsVerified(null);
    retailerRepository.save(retailer);

    return "Retailer rejected successfully";
    }

     public Optional<Admin> getAdminByUserId(Long id) {
        return adminRepository.findAll().stream()
            .filter(admin -> admin.getUser().getId().equals(id))
            .findFirst();
     }

     public List<Map<String, Object>> getAllBusinessUsersWithVerification() {
    List<User> allUsers = userRepository.findAll();
    List<Map<String, Object>> businessUsers = new ArrayList<>();
    
    for (User user : allUsers) {
        Role role = user.getRole();
        
        // Only include FARMER, DISTRIBUTOR, RETAILER roles
        if (role == Role.FARMER || role == Role.DISTRIBUTOR || role == Role.RETAILER) {
            Map<String, Object> userData = new HashMap<>();
            userData.put("id", user.getId());
            userData.put("username", user.getUsername());
            userData.put("role", role.name()); // Use role.name() to get string value
            userData.put("name", user.getName());
            userData.put("email", user.getEmail());
            userData.put("phone", user.getPhone());
            userData.put("address", user.getAddress());
            
            // Get verification status based on role
            Boolean isVerified = getVerificationStatus(user.getId(), role);
            userData.put("is_verified", isVerified);
            
            // Get business-specific details
            String businessName = getBusinessName(user.getId(), role);
            userData.put("businessName", businessName);
            
            businessUsers.add(userData);
        }
    }
    
    return businessUsers;
}

private Boolean getVerificationStatus(Long userId, Role role) {
    switch (role) {
        case FARMER:
            Farmer farmer = farmerRepository.findByUserId(userId);
            return farmer != null ? farmer.getIsVerified() : null;
        case DISTRIBUTOR:
            Distributor distributor = distributorRepository.findByUserId(userId);
            return distributor != null ? distributor.getIsVerified() : null;
        case RETAILER:
            Retailer retailer = retailerRepository.findByUserId(userId);
            return retailer != null ? retailer.getIsVerified() : null;
        default:
            return null;
    }
}

public Long getFarmerIdByUserId(Long userId) {
        try {
            Farmer farmer = farmerRepository.findByUserId(userId);
            return farmer.getFarmerId();
        } catch (Exception e) {
            return null;
        }
    }
    
    
    public Long getDistributorIdByUserId(Long userId) {
        try {
            Distributor distributor = distributorRepository.findByUserId(userId);
            return distributor.getDistributorId();
        } catch (Exception e) {
            return null;
        }
    }
    
    public Long getRetailerIdByUserId(Long userId) {
        try {
            Retailer retailer = retailerRepository.findByUserId(userId);
            return retailer.getRetailerId();
        } catch (Exception e) {
            return null;
        }
    }

private String getBusinessName(Long userId, Role role) {
    switch (role) {
        case FARMER:
            Farmer farmer = farmerRepository.findByUserId(userId);
            return farmer != null ? farmer.getFarmName() : null;
        case DISTRIBUTOR:
            Distributor distributor = distributorRepository.findByUserId(userId);
            return distributor != null ? distributor.getCompanyName() : null;
        case RETAILER:
            Retailer retailer = retailerRepository.findByUserId(userId);
            return retailer != null ? retailer.getBusinessName() : null;
        default:
            return null;
    }
}


public AdminStatsResponse getPlatformStats() {
    AdminStatsResponse stats = new AdminStatsResponse();

    long farmerCount = farmerRepository.count();
    long distributorCount = distributorRepository.count();
    long retailerCount = retailerRepository.count();
    long customerCount = userRepository.countByRole(Role.CONSUMER);

    long approvedFarmers = farmerRepository.countByIsVerified(true);
    long approvedDistributors = distributorRepository.countByIsVerified(true);
    long approvedRetailers = retailerRepository.countByIsVerified(true);

    long pendingFarmers = farmerRepository.countByIsVerified(false);
    long pendingDistributors = distributorRepository.countByIsVerified(false);
    long pendingRetailers = retailerRepository.countByIsVerified(false);

    // Calculate rejected users (null verification status)
    long rejectedFarmers = farmerRepository.countByIsVerifiedIsNull();
    long rejectedDistributors = distributorRepository.countByIsVerifiedIsNull();
    long rejectedRetailers = retailerRepository.countByIsVerifiedIsNull();

    stats.setFarmerCount(farmerCount);
    stats.setDistributorCount(distributorCount);
    stats.setRetailerCount(retailerCount);
    stats.setCustomerCount(customerCount);

    stats.setTotalUsers(farmerCount + distributorCount + retailerCount + customerCount);

    stats.setApprovedUsers(approvedFarmers + approvedDistributors + approvedRetailers + customerCount);
    stats.setPendingUsers(pendingFarmers + pendingDistributors + pendingRetailers);
    stats.setRejectedUsers(rejectedFarmers + rejectedDistributors + rejectedRetailers); // Set rejected users

    return stats;
}

}
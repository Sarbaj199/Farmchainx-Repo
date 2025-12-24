package com.example.backend.controller;

import com.example.backend.dto.*;
import com.example.backend.entity.*;
import com.example.backend.repository.*;
import com.example.backend.service.*;
import com.example.backend.utils.JwtUtil;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.*;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.regex.Pattern;

@RestController
@RequestMapping("/auth")
public class AuthenticationController {

    @Autowired private UserRepository userRepository;
    @Autowired private FarmerService farmerService;
    @Autowired private DistributorService distributorService;
    @Autowired private RetailerService retailerService;
    @Autowired private AdminService adminService;
    @Autowired private CustomerService customerService;
    @Autowired private PasswordEncoder passwordEncoder;
    @Autowired private JwtUtil jwtUtil;

    private static final Pattern EMAIL_PATTERN =
            Pattern.compile("^[A-Za-z0-9+_.-]+@(.+)$");
    private static final Pattern PASSWORD_PATTERN =
            Pattern.compile("^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$");

    private String validateBasicInfo(String username, String email, String password, String phone) {
        if (!StringUtils.hasText(username)) return "Error at validation: Username is required.";
        if (userRepository.existsByUsername(username)) return "Error at validation: Username already exists.";
        if (!StringUtils.hasText(email)) return "Error at validation: Email is required.";
        if (!EMAIL_PATTERN.matcher(email).matches()) return "Error at validation: Invalid email format.";
        if (userRepository.existsByEmail(email)) return "Error at validation: Email already exists.";
        if (!StringUtils.hasText(password)) return "Error at validation: Password is required.";
        if (!PASSWORD_PATTERN.matcher(password).matches())
            return "Error at validation: Password must include uppercase, lowercase, number, and special character.";
        if (!StringUtils.hasText(phone)) return "Error at validation: Phone number is required.";
        if (!phone.matches("^[6-9]\\d{9}$")) return "Error at validation: Invalid phone number format.";
        if (userRepository.existsByPhone(phone)) return "Error at validation: Phone number already exists.";
        return null;
    }

    private User createBaseUser(String username, String email, String password,
                                String phone, String name, String address, Role role) {
        try {
            User user = new User();
            user.setUsername(username);
            user.setEmail(email);
            user.setPasswordHash(passwordEncoder.encode(password));
            user.setPhone(phone);
            user.setName(name);
            user.setAddress(address);
            user.setRole(role);
            user.setActiveStatus(true);
            return userRepository.save(user);
        } catch (Exception e) {
            throw new RuntimeException("Error at createBaseUser: " + e.getMessage());
        }
    }

    // ---------------- REGISTER METHODS ----------------

    @PostMapping("/register/farmer")
    public ResponseEntity<?> registerFarmer(@RequestBody FarmerRegisterRequest request) {
        try {
            String error = validateBasicInfo(request.getUsername(), request.getEmail(), request.getPassword(), request.getPhone());
            if (error != null)
                return ResponseEntity.badRequest().body(Map.of("error", "Error at registerFarmer: " + error));

            User user = createBaseUser(request.getUsername(), request.getEmail(), request.getPassword(),
                    request.getPhone(), request.getName(), request.getAddress(), Role.FARMER);

            Farmer farmer = new Farmer();
            farmer.setUser(user);
            farmer.setFarmName(request.getFarmName());
            farmer.setContactNumber(request.getPhone());
            farmer.setFarmLocation(request.getFarmLocation());
            farmer.setFarmSize(request.getFarmSize());
            farmerService.createFarmer(farmer);

            return ResponseEntity.ok(Map.of("message", "Farmer registered successfully", "userId", user.getId()));

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Error at registerFarmer: " + e.getMessage()));
        }
    }

    @PostMapping("/register/distributor")
    public ResponseEntity<?> registerDistributor(@RequestBody DistributorRegisterRequest request) {
        try {
            String error = validateBasicInfo(request.getUsername(), request.getEmail(), request.getPassword(), request.getPhone());
            if (error != null)
                return ResponseEntity.badRequest().body(Map.of("error", "Error at registerDistributor: " + error));

            User user = createBaseUser(request.getUsername(), request.getEmail(), request.getPassword(),
                    request.getPhone(), request.getName(), request.getAddress(), Role.DISTRIBUTOR);

            Distributor distributor = new Distributor();
            distributor.setUser(user);
            distributor.setCompanyName(request.getCompanyName());
            distributor.setTransportType(request.getTransportType());
            distributor.setCoverageArea(request.getCoverageArea());
            distributor.setWarehouseCapacity(request.getWarehouseCapacity());
            distributor.setLicenseNumber(request.getLicenseNumber());
            distributor.setContactNumber(request.getPhone());
            distributorService.createDistributor(distributor);

            return ResponseEntity.ok(Map.of("message", "Distributor registered successfully", "userId", user.getId()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Error at registerDistributor: " + e.getMessage()));
        }
    }

    @PostMapping("/register/retailer")
    public ResponseEntity<?> registerRetailer(@RequestBody RetailerRegisterRequest request) {
        try {
            String error = validateBasicInfo(request.getUsername(), request.getEmail(), request.getPassword(), request.getPhone());
            if (error != null)
                return ResponseEntity.badRequest().body(Map.of("error", "Error at registerRetailer: " + error));

            User user = createBaseUser(request.getUsername(), request.getEmail(), request.getPassword(),
                    request.getPhone(), request.getName(), request.getAddress(), Role.RETAILER);

            Retailer retailer = new Retailer();
            retailer.setUser(user);
            retailer.setBusinessName(request.getBusinessName());
            retailer.setBusinessLicense(request.getBusinessLicense());
            retailer.setStorageCapacity(request.getStorageCapacity());
            retailer.setOperatingArea(request.getOperatingArea());
            retailerService.createRetailer(retailer);

            return ResponseEntity.ok(Map.of("message", "Retailer registered successfully", "userId", user.getId()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Error at registerRetailer: " + e.getMessage()));
        }
    }

    @PostMapping("/register/customer")
    public ResponseEntity<?> registerCustomer(@RequestBody CustomerRegisterRequest request) {
        try {
            String error = validateBasicInfo(request.getUsername(), request.getEmail(), request.getPassword(), request.getPhone());
            if (error != null)
                return ResponseEntity.badRequest().body(Map.of("error", "Error at registerCustomer: " + error));

            User user = createBaseUser(request.getUsername(), request.getEmail(), request.getPassword(),
                    request.getPhone(), request.getName(), request.getAddress(), Role.CONSUMER);

            Customer customer = new Customer();
            customer.setUser(user);
            customer.setDeliveryAddress(request.getDeliveryAddress());
            customerService.createCustomer(customer);

            return ResponseEntity.ok(Map.of("message", "Customer registered successfully", "userId", user.getId()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Error at registerCustomer: " + e.getMessage()));
        }
    }

    @PostMapping("/register/admin")
    public ResponseEntity<?> registerAdmin(@RequestBody AdminRegisterRequest request) {
        try {
            String error = validateBasicInfo(request.getUsername(), request.getEmail(), request.getPassword(), request.getPhone());
            if (error != null)
                return ResponseEntity.badRequest().body(Map.of("error", "Error at registerAdmin: " + error));

            User user = createBaseUser(request.getUsername(), request.getEmail(), request.getPassword(),
                    request.getPhone(), request.getName(), request.getAddress(), Role.ADMIN);

            Admin admin = new Admin();
            admin.setUser(user);
            admin.setDepartment(request.getDepartment());
            admin.setAdminLevel(request.getAdminLevel());
            adminService.createAdmin(admin);

            return ResponseEntity.ok(Map.of(
                    "message", "Admin registered successfully",
                    "adminId", admin.getAdminId(),
                    "userId", user.getId()
            ));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Error at registerAdmin: " + e.getMessage()));
        }
    }

    @PostMapping("/login")
public ResponseEntity<?> login(@RequestBody LoginRequest request) {
    try {
        Optional<User> userOpt = userRepository.findByEmail(request.getEmail());
        if (userOpt.isEmpty())
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Invalid email or password"));

        User user = userOpt.get();
        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash()))
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Invalid email or password"));

        if (!user.isActiveStatus())
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Account is deactivated"));

        String token = jwtUtil.generateToken(user.getUsername(), user.getRole().name(), user.getId());

        Long mappedId = null;

        switch (user.getRole()) {
            case FARMER -> {
                Optional<Farmer> farmerOpt = farmerService.getFarmerByUserId(user.getId());
                if (farmerOpt.isPresent()) {
                    mappedId = farmerOpt.get().getFarmerId();
                    if (!farmerOpt.get().getIsVerified())
                        return ResponseEntity.status(HttpStatus.FORBIDDEN)
                                .body(Map.of("error", "Account pending admin approval"));
                }
            }

            case DISTRIBUTOR -> {
                Optional<Distributor> distributorOpt = distributorService.getDistributorByUserId(user.getId());
                if (distributorOpt.isPresent()) {
                    mappedId = distributorOpt.get().getDistributorId();
                    if (!distributorOpt.get().getIsVerified())
                        return ResponseEntity.status(HttpStatus.FORBIDDEN)
                                .body(Map.of("error", "Account pending admin approval"));
                }
            }

            case RETAILER -> {
                Optional<Retailer> retailerOpt = retailerService.getRetailerByUserId(user.getId());
                if (retailerOpt.isPresent()) {
                    mappedId = retailerOpt.get().getRetailerId();
                    if (!retailerOpt.get().getIsVerified())
                        return ResponseEntity.status(HttpStatus.FORBIDDEN)
                                .body(Map.of("error", "Account pending admin approval"));
                }
            }

            case ADMIN -> {
                Optional<Admin> adminOpt = adminService.getAdminByUserId(user.getId());
                if (adminOpt.isPresent()) {
                    mappedId = adminOpt.get().getAdminId();
                }
            }

            case CONSUMER -> {
                Optional<Customer> customerOpt = customerService.getCustomerByUserId(user.getId());
                if (customerOpt.isPresent()) {
                    mappedId = customerOpt.get().getCustomerId();
                }
            }
        }

        return ResponseEntity.ok(Map.of(
                "message", "Login successful",
                "token", token,
                "userId", user.getId(),
                "role", user.getRole(),
                "username", user.getUsername(),
                "email", user.getEmail(),
                "id", mappedId   // <<--- ADDED HERE
        ));

    } catch (Exception e) {
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Error at login: " + e.getMessage()));
    }
}
  

    // ---------------- TOKEN VALIDATION ----------------
    @GetMapping("/validate")
    public ResponseEntity<?> validateToken(@RequestHeader("Authorization") String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer "))
            return ResponseEntity.badRequest().body(Map.of("error", "Error at validateToken: Missing or invalid Authorization header"));

        String token = authHeader.substring(7);
        try {
            String username = jwtUtil.extractUsername(token);
            String role = jwtUtil.extractRole(token);
            Long userId = jwtUtil.extractUserId(token);

            return ResponseEntity.ok(Map.of(
                    "message", "Token is valid",
                    "username", username,
                    "role", role,
                    "userId", userId
            ));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Error at validateToken: " + e.getMessage()));
        }
    }

    // ---------------- SECURED ENDPOINT ----------------
    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser() {
        try {
            var auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth == null || !auth.isAuthenticated()) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Error at /me: Unauthorized"));
            }
            return ResponseEntity.ok(Map.of("username", auth.getName(), "authorities", auth.getAuthorities()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Error at /me: " + e.getMessage()));
        }
    }
}

package com.example.backend.service;

import com.example.backend.entity.User;
import com.example.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.util.List;
import java.util.Optional;
import java.util.regex.Pattern;

@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private static final Pattern EMAIL_PATTERN = Pattern.compile("^[A-Za-z0-9+_.-]+@(.+)$");
    private static final Pattern PASSWORD_PATTERN = Pattern.compile("^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$");
    private static final Pattern PHONE_PATTERN = Pattern.compile("^[6-9]\\d{9}$");

    // Validate user details
    private String validateUser(User user, boolean isUpdate, User existingUser) {

        if (!StringUtils.hasText(user.getUsername())) {
            return "Username is required.";
        }

        boolean usernameChanged = !isUpdate || !user.getUsername().equals(existingUser.getUsername());
        if (usernameChanged && userRepository.existsByUsername(user.getUsername())) {
            return "Username already exists.";
        }

        if (!StringUtils.hasText(user.getEmail())) {
            return "Email is required.";
        }
        if (!EMAIL_PATTERN.matcher(user.getEmail()).matches()) {
            return "Invalid email format.";
        }

        boolean emailChanged = !isUpdate || !user.getEmail().equals(existingUser.getEmail());
        if (emailChanged && userRepository.existsByEmail(user.getEmail())) {
            return "Email already exists.";
        }

        if (!StringUtils.hasText(user.getPasswordHash())) {
            return "Password is required.";
        }
        if (!PASSWORD_PATTERN.matcher(user.getPasswordHash()).matches()) {
            return "Password must be at least 8 characters, include uppercase, lowercase, number, and special character.";
        }

        if (user.getRole() == null) {
            return "Role is required.";
        }

        if (!StringUtils.hasText(user.getPhone())) {
            return "Phone number is required.";
        }
        boolean phoneChanged = !isUpdate || !user.getPhone().equals(existingUser.getPhone());
        if (phoneChanged && userRepository.existsByPhone(user.getPhone())) {
            return "Phone number already exists.";
        }
        if (!PHONE_PATTERN.matcher(user.getPhone()).matches()) {
            return "Invalid phone number.";
        }

        return null;
    }

    // Create a new user
    public ResponseEntity<String> createUser(User user) {
        String validationError = validateUser(user, false, null);
        if (validationError != null) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(validationError);
        }

        user.setPasswordHash(passwordEncoder.encode(user.getPasswordHash()));
        user.setActiveStatus(true); // default active
        userRepository.save(user);

        return ResponseEntity.status(HttpStatus.CREATED).body("User created successfully");
    }

    // Get all users
    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    // Get user by ID
    public ResponseEntity<?> getUserById(Long id) {
        Optional<User> userOpt = userRepository.findById(id);
        return userOpt.<ResponseEntity<?>>map(ResponseEntity::ok)
                      .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND).body("User not found"));
    }

    // Update user
    public ResponseEntity<String> updateUser(Long id, User userDetails) {
        Optional<User> existingUserOpt = userRepository.findById(id);
        if (existingUserOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("User not found");
        }

        User existingUser = existingUserOpt.get();
        String validationError = validateUser(userDetails, true, existingUser);
        if (validationError != null) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(validationError);
        }

        existingUser.setUsername(userDetails.getUsername());
        existingUser.setEmail(userDetails.getEmail());
        existingUser.setPasswordHash(passwordEncoder.encode(userDetails.getPasswordHash()));
        existingUser.setName(userDetails.getName());
        existingUser.setPhone(userDetails.getPhone());
        existingUser.setAddress(userDetails.getAddress());
        existingUser.setRole(userDetails.getRole());
        existingUser.setActiveStatus(userDetails.isActiveStatus());

        userRepository.save(existingUser);

        return ResponseEntity.ok("User updated successfully");
    }

    // Delete user
    public ResponseEntity<String> deleteUserById(Long id) {
        if (!userRepository.existsById(id)) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("User not found");
        }
        userRepository.deleteById(id);
        return ResponseEntity.ok("User deleted successfully");
    }
}

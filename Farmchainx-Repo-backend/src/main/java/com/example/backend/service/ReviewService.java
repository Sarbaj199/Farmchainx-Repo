package com.example.backend.service;

import com.example.backend.entity.Review;
import com.example.backend.entity.Crop;
import com.example.backend.entity.User;
import com.example.backend.entity.Transaction;
import com.example.backend.repository.CropRepository;
import com.example.backend.repository.UserRepository;
import com.example.backend.repository.ReviewRepository;
import com.example.backend.repository.TransactionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class ReviewService {
    
    @Autowired
    private ReviewRepository reviewRepository;
    
    @Autowired
    private CropRepository cropRepository;
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private TransactionRepository transactionRepository;
    
   public Review createReviewWithTransaction(Long transactionId, Integer rating, String comment, String reviewerName) {
    System.out.println("🔍 Creating review for transaction: " + transactionId);
    
    try {
        // Validate transaction exists
        Transaction transaction = transactionRepository.findById(transactionId)
                .orElseThrow(() -> new RuntimeException("Transaction not found with id: " + transactionId));
        
        System.out.println("📦 Found transaction: " + transaction.getTransactionId() + ", Status: " + transaction.getDeliveryStatus());
        
        // VALIDATION 1: Check if transaction is delivered
        if (!Transaction.DeliveryStatus.DELIVERED.equals(transaction.getDeliveryStatus())) {
            throw new RuntimeException("Can only review delivered transactions. Current status: " + transaction.getDeliveryStatus());
        }
        
        // VALIDATION 2: Check if transaction already has a review
        boolean hasReview = reviewRepository.existsByTransactionTransactionId(transactionId);
        System.out.println("📊 Transaction already has review: " + hasReview);
        
        if (hasReview) {
            throw new RuntimeException("This transaction already has a review. You can only review each purchase once.");
        }
        
        // Get crop and user from transaction
        Crop crop = transaction.getBatch().getCrop();
        User user = transaction.getToUser(); // The customer who received the product
        
        System.out.println("👤 Reviewing user: " + user.getId() + ", Crop: " + crop.getCropId());
        
        // Create and save review
        Review review = new Review();
        review.setRating(rating);
        review.setComment(comment);
        review.setCrop(crop);
        review.setUser(user);
        review.setTransaction(transaction); // CRITICAL: Link to specific transaction
        review.setReviewerName(reviewerName);
        review.setCreatedAt(LocalDateTime.now());
        
        Review savedReview = reviewRepository.save(review);
        System.out.println("✅ Review created successfully: " + savedReview.getReviewId());
        
        return savedReview;
        
    } catch (Exception e) {
        System.out.println("❌ Error creating review: " + e.getMessage());
        throw e;
    }
}    

public boolean canReviewTransaction(Long transactionId) {
    try {
        Optional<Transaction> transaction = transactionRepository.findById(transactionId);
        if (transaction.isEmpty()) {
            System.out.println("Transaction not found: " + transactionId);
            return false;
        }
        
        Transaction tx = transaction.get();
        System.out.println("Transaction status: " + tx.getDeliveryStatus());
        
        // Check 1: Transaction must be delivered
        if (!"DELIVERED".equals(tx.getDeliveryStatus())) {
            System.out.println("Transaction not delivered: " + tx.getDeliveryStatus());
            return false;
        }
        
        // Check 2: Transaction must not already have a review
        boolean hasReview = reviewRepository.existsByTransactionTransactionId(transactionId);
        System.out.println("Transaction has review: " + hasReview);
        
        return !hasReview;
        
    } catch (Exception e) {
        System.out.println("Error checking review eligibility: " + e.getMessage());
        return false;
    }
}

    // LEGACY: Create review without transaction (one review per crop per user)
    public Review createReview(Long cropId, Long userId, Integer rating, String comment, String reviewerName) {
        // Validate crop exists
        Crop crop = cropRepository.findById(cropId)
                .orElseThrow(() -> new RuntimeException("Crop not found with id: " + cropId));
        
        // Validate user exists
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));
     
        // Create and save review
        Review review = new Review();
        review.setRating(rating);
        review.setComment(comment);
        review.setCrop(crop);
        review.setUser(user);
        review.setReviewerName(reviewerName);
        review.setCreatedAt(LocalDateTime.now());
        
        return reviewRepository.save(review);
    }

    
    public List<Review> getAllReviews() {
        return reviewRepository.findAll();
    }
    
    public List<Review> getReviewsByCropId(Long cropId) {
        return reviewRepository.findByCropCropId(cropId);
    }
    
    public List<Review> getReviewsByUserId(Long userId) {
        return reviewRepository.findByUserUserId(userId);
    }
    
    public Optional<Review> getReviewById(Long reviewId) {
        return reviewRepository.findById(reviewId);
    }
    
    // Get review by transaction ID
    public Optional<Review> getReviewByTransactionId(Long transactionId) {
    try {
        return reviewRepository.findByTransactionTransactionId(transactionId);
    } catch (Exception e) {
        System.out.println("Error fetching review for transaction: " + transactionId + " - " + e.getMessage());
        return Optional.empty();
    }
}
    // Check if transaction can be reviewed
    
    
    // Update review
    public Review updateReview(Long reviewId, Integer rating, String comment) {
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new RuntimeException("Review not found with id: " + reviewId));
        
        if (rating != null) {
            review.setRating(rating);
        }
        if (comment != null) {
            review.setComment(comment);
        }
        
        return reviewRepository.save(review);
    }
    
    public void deleteReview(Long reviewId) {
        reviewRepository.deleteById(reviewId);
    }
    
}
package com.example.backend.controller;

import com.example.backend.entity.Review;
import com.example.backend.service.ReviewService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/reviews")
@CrossOrigin(origins = "*")
public class ReviewController {
    
    @Autowired
    private ReviewService reviewService;

    // CREATE REVIEW FOR A TRANSACTION (Primary Method) - ONE REVIEW PER TRANSACTION
    @PostMapping("/transaction/{transactionId}")
    public ResponseEntity<?> createReviewForTransaction(
            @PathVariable Long transactionId,
            @RequestBody Map<String, Object> reviewData) {
        
        try {
            Integer rating = (Integer) reviewData.get("rating");
            String comment = (String) reviewData.get("comment");
            String reviewerName = (String) reviewData.get("reviewerName");
            
            if (rating == null) {
                return ResponseEntity.badRequest().body("Rating is required");
            }
            
            // Validate rating range
            if (rating < 1 || rating > 5) {
                return ResponseEntity.badRequest().body("Rating must be between 1 and 5");
            }
            
            Review review = reviewService.createReviewWithTransaction(transactionId, rating, comment, reviewerName);
            return ResponseEntity.ok(review);
            
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Error creating review");
        }
    }

    // CHECK IF TRANSACTION CAN BE REVIEWED
    @GetMapping("/transaction/{transactionId}/can-review")
    public ResponseEntity<Boolean> canReviewTransaction(@PathVariable Long transactionId) {
        try {
            boolean canReview = reviewService.canReviewTransaction(transactionId);
            return ResponseEntity.ok(canReview);
        } catch (Exception e) {
            return ResponseEntity.ok(false);
        }
    }

    

    // CREATE REVIEW (without transaction - legacy)
    @PostMapping("/crop/{cropId}/user/{userId}")
    public ResponseEntity<?> createReview(
            @PathVariable Long cropId,
            @PathVariable Long userId,
            @RequestBody Map<String, Object> reviewData) {
        
        try {
            Integer rating = (Integer) reviewData.get("rating");
            String comment = (String) reviewData.get("comment");
            String reviewerName = (String) reviewData.get("reviewerName");
            
            if (rating == null) {
                return ResponseEntity.badRequest().body("Rating is required");
            }
            
            // Validate rating range
            if (rating < 1 || rating > 5) {
                return ResponseEntity.badRequest().body("Rating must be between 1 and 5");
            }
            
            Review review = reviewService.createReview(cropId, userId, rating, comment, reviewerName);
            return ResponseEntity.ok(review);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Error creating review");
        }
    }

    // GET ALL REVIEWS
    @GetMapping
    public ResponseEntity<List<Review>> getAllReviews() {
        return ResponseEntity.ok(reviewService.getAllReviews());
    }

    // GET REVIEWS BY CROP ID
    @GetMapping("/crop/{cropId}")
    public ResponseEntity<List<Review>> getReviewsByCrop(@PathVariable Long cropId) {
        return ResponseEntity.ok(reviewService.getReviewsByCropId(cropId));
    }

    // GET REVIEWS BY USER ID
    @GetMapping("/user/{userId}")
    public ResponseEntity<List<Review>> getReviewsByUser(@PathVariable Long userId) {
        return ResponseEntity.ok(reviewService.getReviewsByUserId(userId));
    }

    // GET REVIEW BY ID
    @GetMapping("/{reviewId}")
    public ResponseEntity<Review> getReviewById(@PathVariable Long reviewId) {
        Optional<Review> review = reviewService.getReviewById(reviewId);
        return review.map(ResponseEntity::ok)
                    .orElse(ResponseEntity.notFound().build());
    }

    // GET REVIEW BY TRANSACTION ID
    @GetMapping("/transaction/{transactionId}")
public ResponseEntity<?> getReviewByTransaction(@PathVariable Long transactionId) {
    try {
        System.out.println("Fetching review for transaction: " + transactionId);
        
        Optional<Review> review = reviewService.getReviewByTransactionId(transactionId);
        
        if (review.isPresent()) {
            // System.out.println("Review found for transaction: " + transactionId);
            return ResponseEntity.ok(review.get());
        } else {
            // System.out.println("No review found for transaction: " + transactionId);
            // Return empty object instead of 404 to prevent frontend errors
            return ResponseEntity.ok(Collections.emptyMap());
        }
        
    } catch (Exception e) {
        System.out.println("Error fetching review for transaction: " + transactionId + " - " + e.getMessage());
        return ResponseEntity.ok(Collections.emptyMap());
    }
}
    
    
    // UPDATE REVIEW
    @PutMapping("/{reviewId}")
    public ResponseEntity<?> updateReview(
            @PathVariable Long reviewId,
            @RequestBody Map<String, Object> reviewData) {
        
        try {
            Integer rating = (Integer) reviewData.get("rating");
            String comment = (String) reviewData.get("comment");
            
            // Validate rating range if provided
            if (rating != null && (rating < 1 || rating > 5)) {
                return ResponseEntity.badRequest().body("Rating must be between 1 and 5");
            }
            
            Review updatedReview = reviewService.updateReview(reviewId, rating, comment);
            return ResponseEntity.ok(updatedReview);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Error updating review");
        }
    }

    // DELETE REVIEW
    @DeleteMapping("/{reviewId}")
    public ResponseEntity<Void> deleteReview(@PathVariable Long reviewId) {
        reviewService.deleteReview(reviewId);
        return ResponseEntity.ok().build();
    }
}
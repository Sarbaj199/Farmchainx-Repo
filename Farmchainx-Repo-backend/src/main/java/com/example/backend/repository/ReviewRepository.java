package com.example.backend.repository;

import com.example.backend.entity.Review;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface ReviewRepository extends JpaRepository<Review, Long> {
    
    // JPQL for findByCropCropId
    @Query("SELECT r FROM Review r WHERE r.crop.cropId = :cropId")
    List<Review> findByCropCropId(@Param("cropId") Long cropId);
    
    // JPQL for findByUserUserId
    @Query("SELECT r FROM Review r WHERE r.user.id = :userId")
    List<Review> findByUserUserId(@Param("userId") Long userId);

    // Find review by transaction ID
        // FIXED: Check if review exists for transaction
    boolean existsByTransactionTransactionId(Long transactionId);
    
    // FIXED: Find review by transaction ID
    Optional<Review> findByTransactionTransactionId(Long transactionId);
    
    // Optional: For legacy system
    
}
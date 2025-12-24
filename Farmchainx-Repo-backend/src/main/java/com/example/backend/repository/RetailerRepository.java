package com.example.backend.repository;

import com.example.backend.entity.Retailer;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface RetailerRepository extends JpaRepository<Retailer, Long> {

    @Query("SELECT r FROM Retailer r WHERE r.user.id = :userId")
    Retailer findByUserId(@Param("userId") Long userId);

    @Query("SELECT r FROM Retailer r WHERE r.user.id = :userId")
    Optional<Retailer> findRetailerByUserId(@Param("userId") Long userId);

    long countByIsVerified(boolean b);

    @Query("SELECT COUNT(r) FROM Retailer r WHERE r.isVerified IS NULL")
    long countByIsVerifiedIsNull();
}
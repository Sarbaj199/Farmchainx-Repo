package com.example.backend.repository;

import com.example.backend.entity.Transaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface TransactionRepository extends JpaRepository<Transaction, Long> {

    @Query("SELECT t FROM Transaction t WHERE t.fromUser.id = :userId")
    List<Transaction> findByFromUserId(@Param("userId") Long userId);

    @Query("SELECT t FROM Transaction t WHERE t.toUser.id = :userId")
    List<Transaction> findByToUserId(@Param("userId") Long userId);

    @Query("SELECT t FROM Transaction t WHERE t.batch.batchId = :batchId")
    List<Transaction> findByBatchId(@Param("batchId") Long batchId);

    List<Transaction> findByPaymentStatus(Transaction.PaymentStatus paymentStatus);
    
    List<Transaction> findByToUserIdAndPaymentStatus(Long userId, Transaction.PaymentStatus paymentStatus);
    
    List<Transaction> findByRazorpayOrderId(String razorpayOrderId);

    // Add these new methods
    @Query("SELECT t FROM Transaction t WHERE t.fromUser.id = :userId AND t.transactionType = :transactionType")
    List<Transaction> findByFromUser_IdAndTransactionType(@Param("userId") Long userId, 
                                                         @Param("transactionType") Transaction.TransactionType transactionType);

    @Query("SELECT t FROM Transaction t WHERE t.toUser.id = :userId AND t.transactionType = :transactionType")
    List<Transaction> findByToUser_IdAndTransactionType(@Param("userId") Long userId, 
                                                       @Param("transactionType") Transaction.TransactionType transactionType);

    @Query("SELECT t FROM Transaction t WHERE t.toUser.id = :distId AND t.transactionType = :transactionType AND t.paymentStatus = :paymentStatus AND t.deliveryStatus = :deliveryStatus")
    List<Transaction> findByToUser_IdAndTransactionTypeAndPaymentStatus(
        @Param("retailerId") Long distId,
        @Param("transactionType") Transaction.TransactionType transactionType,
        @Param("paymentStatus") Transaction.PaymentStatus paymentStatus,
        @Param("deliveryStatus") Transaction.DeliveryStatus deliveryStatus
    );

     @Query("SELECT t FROM Transaction t WHERE t.toUser.id = :retailerId AND t.transactionType = com.example.backend.entity.Transaction.TransactionType.DISTRIBUTOR_TO_RETAILER AND t.paymentStatus = com.example.backend.entity.Transaction.PaymentStatus.PAID AND t.deliveryStatus = com.example.backend.entity.Transaction.DeliveryStatus.DELIVERED")
    List<Transaction> findByToUser_IdAndTransactionTypeAndPaymentStatusAndDeliveryStatus(
        @Param("retailerId") Long retailerId,
        @Param("transactionType") Transaction.TransactionType transactionType,
        @Param("paymentStatus") Transaction.PaymentStatus paymentStatus,
        @Param("deliveryStatus") Transaction.DeliveryStatus deliveryStatus
    );

    @Query("SELECT t FROM Transaction t WHERE t.transactionType = com.example.backend.entity.Transaction.TransactionType.FARMER_TO_DISTRIBUTOR AND t.paymentStatus = com.example.backend.entity.Transaction.PaymentStatus.PAID AND t.deliveryStatus = com.example.backend.entity.Transaction.DeliveryStatus.DELIVERED")
    List<Transaction> findByTransactionTypeAndPaymentStatusAndDeliveryStatus(
        @Param("transactionType") Transaction.TransactionType transactionType,
        @Param("paymentStatus") Transaction.PaymentStatus paymentStatus,
        @Param("deliveryStatus") Transaction.DeliveryStatus deliveryStatus
    );


    @Query("SELECT t.toUser.id FROM Transaction t WHERE t.transactionId = :transactionId")
    Optional<Long> findToUserIdByTransactionId(@Param("transactionId") Long transactionId);
    
 }
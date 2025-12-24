package com.example.backend.repository;

import com.example.backend.entity.Role;
import com.example.backend.entity.User;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    boolean existsByUsername(String username);

    boolean existsByEmail(String email);

    boolean existsByPhone(String phone);

    Optional<User> findByEmail(String email);

    List<User> findByRoleIn(List<Role> roles);

    long countByRole(Role consumer);





    
}

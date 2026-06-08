package com.logistics.mdm.repository;

import com.logistics.mdm.domain.Mapping;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MappingRepository extends JpaRepository<Mapping, Long> {
    List<Mapping> findByUserId(String userId);
}

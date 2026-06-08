package com.logistics.mdm.service;

import com.logistics.mdm.domain.*;
import com.logistics.mdm.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class MdmService {

    private final CorporationRepository corporationRepository;
    private final BranchRepository branchRepository;
    private final WarehouseRepository warehouseRepository;
    private final MappingRepository mappingRepository;
    private final CustomerRepository customerRepository;
    private final PartnerRepository partnerRepository;

    // Corporation CRUD
    public List<Corporation> getAllCorporations() {
        return corporationRepository.findAll();
    }

    public List<Corporation> searchCorporations(String name) {
        return corporationRepository.findByNameContaining(name);
    }

    @Transactional
    public Corporation saveCorporation(Corporation corporation) {
        return corporationRepository.save(corporation);
    }

    @Transactional
    public void deleteCorporation(Long id) {
        corporationRepository.deleteById(id);
    }

    // Branch CRUD
    public List<Branch> getAllBranches() {
        return branchRepository.findAll();
    }

    public List<Branch> searchBranches(String name) {
        return branchRepository.findByNameContaining(name);
    }

    @Transactional
    public Branch saveBranch(Branch branch) {
        return branchRepository.save(branch);
    }

    @Transactional
    public void deleteBranch(Long id) {
        branchRepository.deleteById(id);
    }

    // Warehouse CRUD
    public List<Warehouse> getAllWarehouses() {
        return warehouseRepository.findAll();
    }

    public List<Warehouse> searchWarehouses(String name) {
        return warehouseRepository.findByNameContaining(name);
    }

    @Transactional
    public Warehouse saveWarehouse(Warehouse warehouse) {
        return warehouseRepository.save(warehouse);
    }

    @Transactional
    public void deleteWarehouse(Long id) {
        warehouseRepository.deleteById(id);
    }

    // Mapping CRUD
    public List<Mapping> getAllMappings() {
        return mappingRepository.findAll();
    }

    public List<Mapping> getMappingsByUserId(String userId) {
        return mappingRepository.findByUserId(userId);
    }

    @Transactional
    public Mapping saveMapping(Mapping mapping) {
        return mappingRepository.save(mapping);
    }

    @Transactional
    public void deleteMapping(Long id) {
        mappingRepository.deleteById(id);
    }

    // Customer CRUD
    public List<Customer> getAllCustomers() {
        return customerRepository.findAll();
    }

    public List<Customer> searchCustomers(String name) {
        return customerRepository.findByNameContaining(name);
    }

    @Transactional
    public Customer saveCustomer(Customer customer) {
        return customerRepository.save(customer);
    }

    @Transactional
    public void deleteCustomer(Long id) {
        customerRepository.deleteById(id);
    }

    // Partner CRUD
    public List<Partner> getAllPartners() {
        return partnerRepository.findAll();
    }

    public List<Partner> searchPartners(String name) {
        return partnerRepository.findByNameContaining(name);
    }

    @Transactional
    public Partner savePartner(Partner partner) {
        return partnerRepository.save(partner);
    }

    @Transactional
    public void deletePartner(Long id) {
        partnerRepository.deleteById(id);
    }
}

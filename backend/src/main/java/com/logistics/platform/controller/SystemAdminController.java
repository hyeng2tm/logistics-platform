package com.logistics.platform.controller;

import com.logistics.platform.domain.system.Role;
import com.logistics.platform.domain.system.User;
import com.logistics.platform.dto.MenuResponse;
import com.logistics.platform.dto.MasterCodeResponse;
import com.logistics.platform.dto.DetailCodeResponse;
import com.logistics.platform.dto.UserManagementRequest;
import com.logistics.platform.dto.UserResponse;
import com.logistics.platform.dto.MessageResponse;
import com.logistics.platform.service.system.SystemAdminService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/system")
@RequiredArgsConstructor
public class SystemAdminController {

    private final SystemAdminService systemAdminService;

    @GetMapping("/users")
    public ResponseEntity<List<UserResponse>> getUsers() {
        return ResponseEntity.ok(systemAdminService.getAllUsers());
    }

    @PostMapping("/users")
    public ResponseEntity<User> saveUser(@RequestBody UserManagementRequest request) {
        return ResponseEntity.ok(systemAdminService.saveUser(request));
    }

    @DeleteMapping("/users/{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable String id) {
        systemAdminService.deleteUser(id);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/roles")
    public ResponseEntity<List<Role>> getRoles() {
        return ResponseEntity.ok(systemAdminService.getAllRoles());
    }

    @PostMapping("/roles")
    public ResponseEntity<Role> saveRole(@RequestBody Role role) {
        return ResponseEntity.ok(systemAdminService.saveRole(role));
    }

    @DeleteMapping("/roles/{id}")
    public ResponseEntity<Void> deleteRole(@PathVariable String id) {
        systemAdminService.deleteRole(id);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/codes/master")
    public ResponseEntity<List<MasterCodeResponse>> getMasterCodes() {
        return ResponseEntity.ok(systemAdminService.getAllMasterCodes());
    }

    @PostMapping("/codes/master")
    public ResponseEntity<MasterCodeResponse> saveMasterCode(@RequestBody MasterCodeResponse code) {
        return ResponseEntity.ok(systemAdminService.saveMasterCode(code));
    }

    @DeleteMapping("/codes/master/{id}")
    public ResponseEntity<Void> deleteMasterCode(@PathVariable String id) {
        systemAdminService.deleteMasterCode(id);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/codes/detail/{masterId}")
    public ResponseEntity<List<DetailCodeResponse>> getDetailCodes(@PathVariable String masterId) {
        return ResponseEntity.ok(systemAdminService.getDetailCodesByMasterId(masterId));
    }

    @PostMapping("/codes/detail")
    public ResponseEntity<DetailCodeResponse> saveDetailCode(@RequestBody DetailCodeResponse code) {
        return ResponseEntity.ok(systemAdminService.saveDetailCode(code));
    }

    @DeleteMapping("/codes/detail/{id}")
    public ResponseEntity<Void> deleteDetailCode(@PathVariable Long id) {
        systemAdminService.deleteDetailCode(id);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/menus")
    public ResponseEntity<List<MenuResponse>> getMenus() {
        return ResponseEntity.ok(systemAdminService.getAllMenus());
    }

    @PostMapping("/menus")
    public ResponseEntity<MenuResponse> saveMenu(@RequestBody MenuResponse request) {
        return ResponseEntity.ok(systemAdminService.saveMenu(request));
    }

    @DeleteMapping("/menus/{id}")
    public ResponseEntity<Void> deleteMenu(@PathVariable Long id) {
        systemAdminService.deleteMenu(id);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/messages")
    public ResponseEntity<List<MessageResponse>> getMessages() {
        return ResponseEntity.ok(systemAdminService.getAllMessages());
    }

    @PostMapping("/messages")
    public ResponseEntity<MessageResponse> saveMessage(@RequestBody MessageResponse request) {
        return ResponseEntity.ok(systemAdminService.saveMessage(request));
    }

    @DeleteMapping("/messages/{id}")
    public ResponseEntity<Void> deleteMessage(@PathVariable Long id) {
        systemAdminService.deleteMessage(id);
        return ResponseEntity.ok().build();
    }
}

package com.logistics.wms.controller;

import com.logistics.wms.dto.*;
import com.logistics.wms.service.WmsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.lang.NonNull;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/wms")
@RequiredArgsConstructor
@CrossOrigin(origins = "*", allowedHeaders = "*")
public class WmsController {

    private final WmsService wmsService;

    // =========================================================================
    // 1. Layout Management
    // =========================================================================

    @PostMapping("/layouts/zones")
    public ResponseEntity<LayoutDto.ZoneResponse> saveZone(@RequestBody @NonNull LayoutDto.ZoneRequest request) {
        return ResponseEntity.ok(wmsService.saveZone(request));
    }

    @GetMapping("/layouts/zones")
    public ResponseEntity<List<LayoutDto.ZoneResponse>> getZones(@RequestParam("warehouseId") @NonNull Long warehouseId) {
        return ResponseEntity.ok(wmsService.getZones(warehouseId));
    }

    @DeleteMapping("/layouts/zones/{id}")
    public ResponseEntity<Void> deleteZone(@PathVariable("id") @NonNull Long id) {
        wmsService.deleteZone(id);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/layouts/locations")
    public ResponseEntity<LayoutDto.LocationResponse> saveLocation(@RequestBody @NonNull LayoutDto.LocationRequest request) {
        return ResponseEntity.ok(wmsService.saveLocation(request));
    }

    @GetMapping("/layouts/locations")
    public ResponseEntity<List<LayoutDto.LocationResponse>> getLocations(@RequestParam("zoneId") @NonNull Long zoneId) {
        return ResponseEntity.ok(wmsService.getLocations(zoneId));
    }

    @DeleteMapping("/layouts/locations/{id}")
    public ResponseEntity<Void> deleteLocation(@PathVariable("id") @NonNull Long id) {
        wmsService.deleteLocation(id);
        return ResponseEntity.ok().build();
    }

    // =========================================================================
    // 2. Inbound Management
    // =========================================================================

    @PostMapping("/inbounds")
    public ResponseEntity<InboundDto.Response> createInbound(@RequestBody @NonNull InboundDto.CreateRequest request) {
        return ResponseEntity.ok(wmsService.createInbound(request));
    }

    @GetMapping("/inbounds")
    public ResponseEntity<List<InboundDto.Response>> getInbounds(@RequestParam(value = "warehouseId", required = false) Long warehouseId) {
        return ResponseEntity.ok(wmsService.getInbounds(warehouseId));
    }

    @PostMapping("/inbounds/{id}/approve")
    public ResponseEntity<InboundDto.Response> approveInbound(@PathVariable("id") @NonNull Long id) {
        return ResponseEntity.ok(wmsService.approveInbound(id));
    }

    @PostMapping("/inbounds/{id}/receive")
    public ResponseEntity<InboundDto.Response> receiveInbound(
            @PathVariable("id") @NonNull Long id,
            @RequestBody @NonNull InboundDto.ReceiveRequest request) {
        return ResponseEntity.ok(wmsService.receiveInbound(id, request));
    }

    @PostMapping("/inbounds/{id}/putaway")
    public ResponseEntity<InboundDto.Response> putawayInbound(
            @PathVariable("id") @NonNull Long id,
            @RequestBody @NonNull InboundDto.PutawayRequest request) {
        return ResponseEntity.ok(wmsService.putawayInbound(id, request));
    }

    // =========================================================================
    // 3. Outbound Management
    // =========================================================================

    @PostMapping("/outbounds")
    public ResponseEntity<OutboundDto.Response> createOutbound(@RequestBody @NonNull OutboundDto.CreateRequest request) {
        return ResponseEntity.ok(wmsService.createOutbound(request));
    }

    @GetMapping("/outbounds")
    public ResponseEntity<List<OutboundDto.Response>> getOutbounds(@RequestParam(value = "warehouseId", required = false) Long warehouseId) {
        return ResponseEntity.ok(wmsService.getOutbounds(warehouseId));
    }

    @PostMapping("/outbounds/{id}/pick")
    public ResponseEntity<OutboundDto.Response> pickOutbound(
            @PathVariable("id") @NonNull Long id,
            @RequestBody @NonNull OutboundDto.PickRequest request) {
        return ResponseEntity.ok(wmsService.pickOutbound(id, request));
    }

    @PostMapping("/outbounds/{id}/ship")
    public ResponseEntity<OutboundDto.Response> shipOutbound(@PathVariable("id") @NonNull Long id) {
        return ResponseEntity.ok(wmsService.shipOutbound(id));
    }

    // =========================================================================
    // 4. Inventory Management
    // =========================================================================

    @GetMapping("/inventories")
    public ResponseEntity<List<InventoryDto.Response>> getInventory(
            @RequestParam(value = "warehouseId", required = false) Long warehouseId,
            @RequestParam(value = "locationId", required = false) Long locationId,
            @RequestParam(value = "itemCode", required = false) String itemCode) {
        return ResponseEntity.ok(wmsService.getInventory(warehouseId, locationId, itemCode));
    }

    @GetMapping("/inventories/history")
    public ResponseEntity<List<InventoryDto.HistoryResponse>> getInventoryHistory(
            @RequestParam(value = "warehouseId", required = false) Long warehouseId,
            @RequestParam(value = "itemCode", required = false) String itemCode) {
        return ResponseEntity.ok(wmsService.getInventoryHistory(warehouseId, itemCode));
    }

    @PostMapping("/inventories/adjust")
    public ResponseEntity<InventoryDto.Response> adjustInventory(@RequestBody @NonNull InventoryDto.AdjustRequest request) {
        return ResponseEntity.ok(wmsService.adjustInventory(request));
    }
}

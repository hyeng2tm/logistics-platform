package com.logistics.wms.service;

import com.logistics.wms.domain.*;
import com.logistics.wms.dto.*;
import com.logistics.wms.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
@Slf4j
public class WmsService {

    private final WarehouseZoneRepository zoneRepository;
    private final WarehouseLocationRepository locationRepository;
    private final InboundRequestRepository inboundRepository;
    private final InboundItemRepository inboundItemRepository;
    private final OutboundRequestRepository outboundRepository;
    private final OutboundItemRepository outboundItemRepository;
    private final InventoryRepository inventoryRepository;
    private final InventoryHistoryRepository inventoryHistoryRepository;
    private final MdmServiceClient mdmServiceClient;

    // =========================================================================
    // 1. Warehouse Layout Management
    // =========================================================================

    @Transactional
    public LayoutDto.ZoneResponse saveZone(@NonNull LayoutDto.ZoneRequest request) {
        if (!mdmServiceClient.isValidWarehouse(request.getWarehouseId())) {
            throw new IllegalArgumentException("Invalid Warehouse ID referenced from MDM: " + request.getWarehouseId());
        }

        WarehouseZone zone = WarehouseZone.builder()
                .warehouseId(request.getWarehouseId())
                .code(request.getCode())
                .name(request.getName())
                .type(request.getType())
                .useYn(request.getUseYn() != null ? request.getUseYn() : "Y")
                .build();

        WarehouseZone saved = zoneRepository.save(zone);
        return mapToZoneResponse(saved);
    }

    public List<LayoutDto.ZoneResponse> getZones(@NonNull Long warehouseId) {
        return zoneRepository.findByWarehouseId(warehouseId).stream()
                .map(this::mapToZoneResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public void deleteZone(@NonNull Long id) {
        zoneRepository.deleteById(id);
    }

    @Transactional
    public LayoutDto.LocationResponse saveLocation(@NonNull LayoutDto.LocationRequest request) {
        WarehouseZone zone = zoneRepository.findById(request.getZoneId())
                .orElseThrow(() -> new IllegalArgumentException("Zone not found for ID: " + request.getZoneId()));

        WarehouseLocation location = WarehouseLocation.builder()
                .zoneId(zone.getId())
                .code(request.getCode())
                .rack(request.getRack())
                .row(request.getRow())
                .level(request.getLevel())
                .useYn(request.getUseYn() != null ? request.getUseYn() : "Y")
                .build();

        WarehouseLocation saved = locationRepository.save(location);
        return mapToLocationResponse(saved);
    }

    public List<LayoutDto.LocationResponse> getLocations(@NonNull Long zoneId) {
        return locationRepository.findByZoneId(zoneId).stream()
                .map(this::mapToLocationResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public void deleteLocation(@NonNull Long id) {
        locationRepository.deleteById(id);
    }

    // =========================================================================
    // 2. Inbound Management
    // =========================================================================

    @Transactional
    public InboundDto.Response createInbound(@NonNull InboundDto.CreateRequest request) {
        // MDM Validation
        if (!mdmServiceClient.isValidWarehouse(request.getWarehouseId())) {
            throw new IllegalArgumentException("Invalid Warehouse ID from MDM: " + request.getWarehouseId());
        }
        if (!mdmServiceClient.isValidCustomer(request.getCustomerId())) {
            throw new IllegalArgumentException("Invalid Customer ID from MDM: " + request.getCustomerId());
        }
        if (!mdmServiceClient.isValidPartner(request.getPartnerId())) {
            throw new IllegalArgumentException("Invalid Partner ID from MDM: " + request.getPartnerId());
        }

        String inboundNo = "IN-" + LocalDate.now().toString().replace("-", "") + "-" + UUID.randomUUID().toString().substring(0, 6).toUpperCase();

        InboundRequest inbound = InboundRequest.builder()
                .inboundNo(inboundNo)
                .warehouseId(request.getWarehouseId())
                .customerId(request.getCustomerId())
                .partnerId(request.getPartnerId())
                .status("REQUESTED")
                .inboundDate(request.getInboundDate() != null ? request.getInboundDate() : LocalDate.now())
                .build();

        InboundRequest saved = inboundRepository.save(inbound);

        List<InboundItem> savedItems = new ArrayList<>();
        if (request.getItems() != null) {
            for (InboundDto.ItemRequest itemReq : request.getItems()) {
                InboundItem item = InboundItem.builder()
                        .inboundId(saved.getId())
                        .itemCode(itemReq.getItemCode())
                        .itemName(itemReq.getItemName())
                        .qtyRequested(itemReq.getQtyRequested())
                        .qtyReceived(0)
                        .build();
                savedItems.add(inboundItemRepository.save(item));
            }
        }

        return mapToInboundResponse(saved, savedItems);
    }

    @Transactional
    public InboundDto.Response approveInbound(@NonNull Long id) {
        InboundRequest request = inboundRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Inbound request not found for ID: " + id));

        if (!"REQUESTED".equals(request.getStatus())) {
            throw new IllegalStateException("Only REQUESTED inbound requests can be approved.");
        }

        request.setStatus("APPROVED");
        List<InboundItem> items = inboundItemRepository.findByInboundId(id);
        return mapToInboundResponse(inboundRepository.save(request), items);
    }

    @Transactional
    public InboundDto.Response receiveInbound(@NonNull Long id, @NonNull InboundDto.ReceiveRequest receiveRequest) {
        InboundRequest inbound = inboundRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Inbound request not found for ID: " + id));

        if (!"APPROVED".equals(inbound.getStatus())) {
            throw new IllegalStateException("Only APPROVED inbound requests can be received.");
        }

        List<InboundItem> items = inboundItemRepository.findByInboundId(id);

        for (InboundDto.ItemReceiveRequest recItem : receiveRequest.getItems()) {
            InboundItem item = items.stream()
                    .filter(i -> i.getId().equals(recItem.getItemId()))
                    .findFirst()
                    .orElseThrow(() -> new IllegalArgumentException("Item ID " + recItem.getItemId() + " not found in this inbound request."));
            item.setQtyReceived(recItem.getQtyReceived());
            inboundItemRepository.save(item);
        }

        inbound.setStatus("RECEIVED");
        return mapToInboundResponse(inboundRepository.save(inbound), items);
    }

    @Transactional
    public InboundDto.Response putawayInbound(@NonNull Long id, @NonNull InboundDto.PutawayRequest putawayRequest) {
        InboundRequest inbound = inboundRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Inbound request not found for ID: " + id));

        if (!"RECEIVED".equals(inbound.getStatus())) {
            throw new IllegalStateException("Only RECEIVED inbound requests can be putaway.");
        }

        List<InboundItem> items = inboundItemRepository.findByInboundId(id);

        for (InboundDto.ItemPutawayRequest putItem : putawayRequest.getItems()) {
            InboundItem item = items.stream()
                    .filter(i -> i.getId().equals(putItem.getItemId()))
                    .findFirst()
                    .orElseThrow(() -> new IllegalArgumentException("Item ID " + putItem.getItemId() + " not found."));

            // Validate Location
            WarehouseLocation location = locationRepository.findById(putItem.getLocationId())
                    .orElseThrow(() -> new IllegalArgumentException("Location ID " + putItem.getLocationId() + " not found."));

            item.setLocationId(location.getId());
            inboundItemRepository.save(item);

            // Update Inventory
            Optional<Inventory> optInv = inventoryRepository.findByWarehouseIdAndLocationIdAndItemCode(
                    inbound.getWarehouseId(), location.getId(), item.getItemCode());

            if (optInv.isPresent()) {
                Inventory inv = optInv.get();
                inv.setQty(inv.getQty() + item.getQtyReceived());
                inventoryRepository.save(inv);
            } else {
                Inventory inv = Inventory.builder()
                        .warehouseId(inbound.getWarehouseId())
                        .locationId(location.getId())
                        .itemCode(item.getItemCode())
                        .itemName(item.getItemName())
                        .qty(item.getQtyReceived())
                        .build();
                inventoryRepository.save(inv);
            }

            // Record Inventory History
            InventoryHistory history = InventoryHistory.builder()
                    .warehouseId(inbound.getWarehouseId())
                    .locationId(location.getId())
                    .itemCode(item.getItemCode())
                    .qtyChange(item.getQtyReceived())
                    .type("INBOUND")
                    .referenceNo(inbound.getInboundNo())
                    .build();
            inventoryHistoryRepository.save(history);
        }

        inbound.setStatus("PUTAWAY");
        return mapToInboundResponse(inboundRepository.save(inbound), items);
    }

    public List<InboundDto.Response> getInbounds(Long warehouseId) {
        List<InboundRequest> list = warehouseId != null ?
                inboundRepository.findByWarehouseId(warehouseId) : inboundRepository.findAll();

        return list.stream()
                .map(inb -> mapToInboundResponse(inb, inboundItemRepository.findByInboundId(inb.getId())))
                .collect(Collectors.toList());
    }

    // =========================================================================
    // 3. Outbound Management
    // =========================================================================

    @Transactional
    public OutboundDto.Response createOutbound(@NonNull OutboundDto.CreateRequest request) {
        // MDM Validation
        if (!mdmServiceClient.isValidWarehouse(request.getWarehouseId())) {
            throw new IllegalArgumentException("Invalid Warehouse ID from MDM: " + request.getWarehouseId());
        }
        if (!mdmServiceClient.isValidCustomer(request.getCustomerId())) {
            throw new IllegalArgumentException("Invalid Customer ID from MDM: " + request.getCustomerId());
        }
        if (!mdmServiceClient.isValidPartner(request.getPartnerId())) {
            throw new IllegalArgumentException("Invalid Partner ID from MDM: " + request.getPartnerId());
        }

        String outboundNo = "OUT-" + LocalDate.now().toString().replace("-", "") + "-" + UUID.randomUUID().toString().substring(0, 6).toUpperCase();

        OutboundRequest outbound = OutboundRequest.builder()
                .outboundNo(outboundNo)
                .warehouseId(request.getWarehouseId())
                .customerId(request.getCustomerId())
                .partnerId(request.getPartnerId())
                .status("REQUESTED")
                .outboundDate(request.getOutboundDate() != null ? request.getOutboundDate() : LocalDate.now())
                .build();

        OutboundRequest saved = outboundRepository.save(outbound);

        List<OutboundItem> savedItems = new ArrayList<>();
        if (request.getItems() != null) {
            for (OutboundDto.ItemRequest itemReq : request.getItems()) {
                OutboundItem item = OutboundItem.builder()
                        .outboundId(saved.getId())
                        .itemCode(itemReq.getItemCode())
                        .itemName(itemReq.getItemName())
                        .qtyRequested(itemReq.getQtyRequested())
                        .qtyShipped(0)
                        .build();
                savedItems.add(outboundItemRepository.save(item));
            }
        }

        return mapToOutboundResponse(saved, savedItems);
    }

    @Transactional
    public OutboundDto.Response pickOutbound(@NonNull Long id, @NonNull OutboundDto.PickRequest pickRequest) {
        OutboundRequest outbound = outboundRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Outbound request not found for ID: " + id));

        if (!"REQUESTED".equals(outbound.getStatus()) && !"PICKING".equals(outbound.getStatus())) {
            throw new IllegalStateException("Only REQUESTED or PICKING outbound requests can be processed for picking.");
        }

        List<OutboundItem> items = outboundItemRepository.findByOutboundId(id);

        for (OutboundDto.ItemPickRequest pickItem : pickRequest.getItems()) {
            OutboundItem item = items.stream()
                    .filter(i -> i.getId().equals(pickItem.getItemId()))
                    .findFirst()
                    .orElseThrow(() -> new IllegalArgumentException("Item ID " + pickItem.getItemId() + " not found."));

            // Check and reduce Inventory
            Inventory inventory = inventoryRepository.findByWarehouseIdAndLocationIdAndItemCode(
                    outbound.getWarehouseId(), pickItem.getLocationId(), item.getItemCode())
                    .orElseThrow(() -> new IllegalArgumentException("Stock not found for item " + item.getItemCode() + " at location " + pickItem.getLocationId()));

            if (inventory.getQty() < pickItem.getQtyPicked()) {
                throw new IllegalArgumentException("Insufficient inventory. Available: " + inventory.getQty() + ", Requested picking: " + pickItem.getQtyPicked());
            }

            inventory.setQty(inventory.getQty() - pickItem.getQtyPicked());
            inventoryRepository.save(inventory);

            // Record Inventory History
            InventoryHistory history = InventoryHistory.builder()
                    .warehouseId(outbound.getWarehouseId())
                    .locationId(pickItem.getLocationId())
                    .itemCode(item.getItemCode())
                    .qtyChange(-pickItem.getQtyPicked())
                    .type("OUTBOUND")
                    .referenceNo(outbound.getOutboundNo())
                    .build();
            inventoryHistoryRepository.save(history);

            // Update Outbound Item shipped qty
            item.setQtyShipped(item.getQtyShipped() + pickItem.getQtyPicked());
            outboundItemRepository.save(item);
        }

        outbound.setStatus("PACKING");
        return mapToOutboundResponse(outboundRepository.save(outbound), items);
    }

    @Transactional
    public OutboundDto.Response shipOutbound(@NonNull Long id) {
        OutboundRequest outbound = outboundRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Outbound request not found for ID: " + id));

        if (!"PACKING".equals(outbound.getStatus())) {
            throw new IllegalStateException("Only PACKING outbound requests can be shipped.");
        }

        outbound.setStatus("SHIPPED");
        List<OutboundItem> items = outboundItemRepository.findByOutboundId(id);
        return mapToOutboundResponse(outboundRepository.save(outbound), items);
    }

    public List<OutboundDto.Response> getOutbounds(Long warehouseId) {
        List<OutboundRequest> list = warehouseId != null ?
                outboundRepository.findByWarehouseId(warehouseId) : outboundRepository.findAll();

        return list.stream()
                .map(outb -> mapToOutboundResponse(outb, outboundItemRepository.findByOutboundId(outb.getId())))
                .collect(Collectors.toList());
    }

    // =========================================================================
    // 4. Inventory Management
    // =========================================================================

    public List<InventoryDto.Response> getInventory(Long warehouseId, Long locationId, String itemCode) {
        List<Inventory> list;
        if (warehouseId != null && locationId != null && itemCode != null) {
            list = inventoryRepository.findByWarehouseIdAndLocationIdAndItemCode(warehouseId, locationId, itemCode)
                    .map(List::of).orElse(List.of());
        } else if (warehouseId != null && locationId != null) {
            list = inventoryRepository.findByWarehouseIdAndLocationId(warehouseId, locationId);
        } else if (warehouseId != null) {
            list = inventoryRepository.findByWarehouseId(warehouseId);
        } else if (itemCode != null) {
            list = inventoryRepository.findByItemCode(itemCode);
        } else {
            list = inventoryRepository.findAll();
        }

        return list.stream()
                .map(this::mapToInventoryResponse)
                .collect(Collectors.toList());
    }

    public List<InventoryDto.HistoryResponse> getInventoryHistory(Long warehouseId, String itemCode) {
        List<InventoryHistory> list;
        if (warehouseId != null) {
            list = inventoryHistoryRepository.findByWarehouseId(warehouseId);
        } else if (itemCode != null) {
            list = inventoryHistoryRepository.findByItemCode(itemCode);
        } else {
            list = inventoryHistoryRepository.findAll();
        }

        return list.stream()
                .map(this::mapToInventoryHistoryResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public InventoryDto.Response adjustInventory(@NonNull InventoryDto.AdjustRequest request) {
        // Validate Layout Location
        WarehouseLocation location = locationRepository.findById(request.getLocationId())
                .orElseThrow(() -> new IllegalArgumentException("Location ID " + request.getLocationId() + " not found."));

        Optional<Inventory> optInv = inventoryRepository.findByWarehouseIdAndLocationIdAndItemCode(
                request.getWarehouseId(), request.getLocationId(), request.getItemCode());

        int currentQty = 0;
        Inventory inventory;

        if (optInv.isPresent()) {
            inventory = optInv.get();
            currentQty = inventory.getQty();
            inventory.setQty(request.getQty());
            inventoryRepository.save(inventory);
        } else {
            inventory = Inventory.builder()
                    .warehouseId(request.getWarehouseId())
                    .locationId(request.getLocationId())
                    .itemCode(request.getItemCode())
                    .itemName(request.getItemName() != null ? request.getItemName() : "Adjusted Item")
                    .qty(request.getQty())
                    .build();
            inventory = inventoryRepository.save(inventory);
        }

        int qtyChange = request.getQty() - currentQty;

        if (qtyChange != 0) {
            InventoryHistory history = InventoryHistory.builder()
                    .warehouseId(request.getWarehouseId())
                    .locationId(request.getLocationId())
                    .itemCode(request.getItemCode())
                    .qtyChange(qtyChange)
                    .type("ADJUSTMENT")
                    .referenceNo(null)
                    .build();
            inventoryHistoryRepository.save(history);
        }

        return mapToInventoryResponse(inventory);
    }

    // =========================================================================
    // Private Mapping Helpers
    // =========================================================================

    private LayoutDto.ZoneResponse mapToZoneResponse(WarehouseZone zone) {
        List<LayoutDto.LocationResponse> locs = locationRepository.findByZoneId(zone.getId()).stream()
                .map(this::mapToLocationResponse)
                .collect(Collectors.toList());

        return LayoutDto.ZoneResponse.builder()
                .id(zone.getId())
                .warehouseId(zone.getWarehouseId())
                .code(zone.getCode())
                .name(zone.getName())
                .type(zone.getType())
                .useYn(zone.getUseYn())
                .locations(locs)
                .build();
    }

    private LayoutDto.LocationResponse mapToLocationResponse(WarehouseLocation loc) {
        return LayoutDto.LocationResponse.builder()
                .id(loc.getId())
                .zoneId(loc.getZoneId())
                .code(loc.getCode())
                .rack(loc.getRack())
                .row(loc.getRow())
                .level(loc.getLevel())
                .useYn(loc.getUseYn())
                .build();
    }

    private InboundDto.Response mapToInboundResponse(InboundRequest inb, List<InboundItem> items) {
        List<InboundDto.ItemResponse> itemResponses = items.stream()
                .map(i -> InboundDto.ItemResponse.builder()
                        .id(i.getId())
                        .itemCode(i.getItemCode())
                        .itemName(i.getItemName())
                        .qtyRequested(i.getQtyRequested())
                        .qtyReceived(i.getQtyReceived())
                        .locationId(i.getLocationId())
                        .build())
                .collect(Collectors.toList());

        return InboundDto.Response.builder()
                .id(inb.getId())
                .inboundNo(inb.getInboundNo())
                .warehouseId(inb.getWarehouseId())
                .customerId(inb.getCustomerId())
                .partnerId(inb.getPartnerId())
                .status(inb.getStatus())
                .inboundDate(inb.getInboundDate())
                .items(itemResponses)
                .build();
    }

    private OutboundDto.Response mapToOutboundResponse(OutboundRequest outb, List<OutboundItem> items) {
        List<OutboundDto.ItemResponse> itemResponses = items.stream()
                .map(i -> OutboundDto.ItemResponse.builder()
                        .id(i.getId())
                        .itemCode(i.getItemCode())
                        .itemName(i.getItemName())
                        .qtyRequested(i.getQtyRequested())
                        .qtyShipped(i.getQtyShipped())
                        .build())
                .collect(Collectors.toList());

        return OutboundDto.Response.builder()
                .id(outb.getId())
                .outboundNo(outb.getOutboundNo())
                .warehouseId(outb.getWarehouseId())
                .customerId(outb.getCustomerId())
                .partnerId(outb.getPartnerId())
                .status(outb.getStatus())
                .outboundDate(outb.getOutboundDate())
                .items(itemResponses)
                .build();
    }

    private InventoryDto.Response mapToInventoryResponse(Inventory inv) {
        return InventoryDto.Response.builder()
                .id(inv.getId())
                .warehouseId(inv.getWarehouseId())
                .locationId(inv.getLocationId())
                .itemCode(inv.getItemCode())
                .itemName(inv.getItemName())
                .qty(inv.getQty())
                .updatedAt(inv.getUpdatedAt())
                .build();
    }

    private InventoryDto.HistoryResponse mapToInventoryHistoryResponse(InventoryHistory hist) {
        return InventoryDto.HistoryResponse.builder()
                .id(hist.getId())
                .warehouseId(hist.getWarehouseId())
                .locationId(hist.getLocationId())
                .itemCode(hist.getItemCode())
                .qtyChange(hist.getQtyChange())
                .type(hist.getType())
                .referenceNo(hist.getReferenceNo())
                .createdAt(hist.getCreatedAt())
                .build();
    }
}

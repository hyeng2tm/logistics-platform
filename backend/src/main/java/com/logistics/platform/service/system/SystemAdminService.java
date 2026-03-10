package com.logistics.platform.service.system;

import com.logistics.platform.domain.system.*;
import com.logistics.platform.dto.MenuResponse;
import com.logistics.platform.dto.MasterCodeResponse;
import com.logistics.platform.dto.DetailCodeResponse;
import com.logistics.platform.dto.MessageResponse;

import com.logistics.platform.dto.UserManagementRequest;
import com.logistics.platform.dto.UserResponse;
import com.logistics.platform.repository.system.*;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
@SuppressWarnings("null")
public class SystemAdminService {

    private final UserRepository userRepository;
    private final UserAuthRepository userAuthRepository;
    private final RoleRepository roleRepository;
    private final MasterCodeRepository masterCodeRepository;
    private final DetailCodeRepository detailCodeRepository;
    private final MenuRepository menuRepository;
    private final MessageRepository messageRepository;
    private final FavoriteMenuRepository favoriteMenuRepository;
    private final PasswordEncoder passwordEncoder;

    public List<UserResponse> getAllUsers() {
        List<User> users = userRepository.findAll();
        return users.stream().map(user -> {
            Optional<UserAuth> authOptional = userAuthRepository.findByUsername(user.getUsername());
            String email = authOptional.map(UserAuth::getEmail).orElse(null);
            String role = authOptional.map(UserAuth::getRole).orElse("ROLE_USER");

            return UserResponse.builder()
                    .id(user.getId())
                    .username(user.getUsername())
                    .name(user.getName())
                    .department(user.getDepartment())
                    .roleId(role) // Use role from UserAuth
                    .lastLogin(user.getLastLogin())
                    .status(user.getStatus())
                    .email(email)
                    .language(user.getLanguage())
                    .build();
        }).toList();
    }

    public UserResponse getUserByUsername(String username) {
        return userRepository.findByUsername(username).map(user -> {
            Optional<UserAuth> authOptional = userAuthRepository.findByUsername(user.getUsername());
            String email = authOptional.map(UserAuth::getEmail).orElse(null);
            String role = authOptional.map(UserAuth::getRole).orElse("ROLE_USER");

            return UserResponse.builder()
                    .id(user.getId())
                    .username(user.getUsername())
                    .name(user.getName())
                    .department(user.getDepartment())
                    .roleId(role)
                    .lastLogin(user.getLastLogin())
                    .status(user.getStatus())
                    .email(email)
                    .language(user.getLanguage())
                    .build();
        }).orElseThrow(() -> new RuntimeException("User not found: " + username));
    }

    public List<Role> getAllRoles() {
        return roleRepository.findAll();
    }

    public List<MasterCodeResponse> getAllMasterCodes() {
        return masterCodeRepository.findAll().stream()
                .map(this::convertToMasterCodeResponse)
                .toList();
    }

    private MasterCodeResponse convertToMasterCodeResponse(MasterCode code) {
        Map<String, String> translations = code.getTranslations() == null ? Map.of()
                : code.getTranslations().stream()
                        .filter(t -> t.getLangCode() != null && t.getName() != null)
                        .collect(Collectors.toMap(MasterCodeTranslation::getLangCode, MasterCodeTranslation::getName,
                                (v1, v2) -> v1));

        return MasterCodeResponse.builder()
                .id(code.getId())
                .name(code.getName())
                .description(code.getDescription())
                .translations(translations)
                .build();
    }

    public List<DetailCodeResponse> getDetailCodesByMasterId(String masterId) {
        return detailCodeRepository.findByMasterCodeIdOrderBySortOrderAsc(masterId).stream()
                .map(this::convertToDetailCodeResponse)
                .toList();
    }

    private DetailCodeResponse convertToDetailCodeResponse(DetailCode code) {
        Map<String, String> translations = code.getTranslations() == null ? Map.of()
                : code.getTranslations().stream()
                        .filter(t -> t.getLangCode() != null && t.getLabel() != null)
                        .collect(Collectors.toMap(DetailCodeTranslation::getLangCode, DetailCodeTranslation::getLabel,
                                (v1, v2) -> v1));

        return DetailCodeResponse.builder()
                .id(code.getId())
                .masterCodeId(code.getMasterCodeId())
                .code(code.getCode())
                .label(code.getLabel())
                .sortOrder(code.getSortOrder())
                .useYn(code.getUseYn())
                .translations(translations)
                .build();
    }

    public List<MenuResponse> getAllMenus() {
        return menuRepository.findAllByOrderByParentIdAscSortOrderAsc().stream()
                .map(this::convertToMenuResponse)
                .toList();
    }

    private MenuResponse convertToMenuResponse(Menu menu) {
        Map<String, String> translations = menu.getTranslations() == null ? Map.of()
                : menu.getTranslations().stream()
                        .filter(t -> t.getLangCode() != null && t.getTitle() != null)
                        .collect(Collectors.toMap(MenuTranslation::getLangCode, MenuTranslation::getTitle,
                                (v1, v2) -> v1));

        return MenuResponse.builder()
                .id(menu.getId())
                .parentId(menu.getParentId())
                .menuKey(menu.getMenuKey())
                .translations(translations)
                .path(menu.getPath())
                .icon(menu.getIcon())
                .sortOrder(menu.getSortOrder())
                .isVisible(menu.getIsVisible())
                .isPc(menu.getIsPc())
                .isMobile(menu.getIsMobile())
                .build();
    }

    public List<MessageResponse> getAllMessages() {
        return messageRepository.findAll().stream()
                .map(this::convertToMessageResponse)
                .toList();
    }

    private MessageResponse convertToMessageResponse(Message message) {
        Map<String, String> translations = message.getTranslations() == null ? Map.of()
                : message.getTranslations().stream()
                        .filter(t -> t.getLangCode() != null && t.getContent() != null)
                        .collect(Collectors.toMap(MessageTranslation::getLangCode, MessageTranslation::getContent,
                                (v1, v2) -> v1));

        return MessageResponse.builder()
                .id(message.getId())
                .messageKey(message.getMessageKey())
                .category(message.getCategory())
                .description(message.getDescription())
                .translations(translations)
                .build();
    }

    // CRUD for User (Profile + Auth)
    @Transactional
    public User saveUser(UserManagementRequest request) {
        // 1. Manage UserAuth (Credentials)
        UserAuth auth = userAuthRepository.findByUsername(request.getUsername())
                .orElse(new UserAuth());

        auth.setUsername(request.getUsername());
        if (request.getEmail() != null) {
            auth.setEmail(request.getEmail());
        }
        if (request.getPassword() != null && !request.getPassword().isEmpty()) {
            auth.setPassword(passwordEncoder.encode(request.getPassword()));
        } else if (auth.getPassword() == null) {
            // New user must have a password
            auth.setPassword(passwordEncoder.encode("1234")); // Default password if empty
        }
        auth.setRole(request.getRoleId());
        userAuthRepository.save(auth);

        // 2. Manage User (Profile)
        User user = userRepository.findById(request.getId())
                .orElse(new User());

        user.setId(request.getId());
        user.setUsername(request.getUsername());
        user.setName(request.getName());
        user.setDepartment(request.getDepartment());
        user.setStatus(request.getStatus());
        if (request.getLanguage() != null) {
            user.setLanguage(request.getLanguage());
        }

        return userRepository.save(user);
    }

    @Transactional
    public void deleteUser(String id) {
        userRepository.findById(id).ifPresent(user -> {
            userAuthRepository.deleteByUsername(user.getUsername());
            userRepository.delete(user);
        });
    }

    // CRUD for Role
    @Transactional
    public Role saveRole(Role role) {
        return roleRepository.save(role);
    }

    @Transactional
    public void deleteRole(String id) {
        roleRepository.deleteById(id);
    }

    // CRUD for MasterCode
    @Transactional
    public MasterCodeResponse saveMasterCode(MasterCodeResponse request) {
        MasterCode code = masterCodeRepository.findById(request.getId() != null ? request.getId() : "")
                .orElse(new MasterCode());

        code.setId(request.getId());
        code.setName(request.getName());
        code.setDescription(request.getDescription());

        // Update translations
        if (request.getTranslations() != null) {
            code.getTranslations().clear();
            for (Map.Entry<String, String> entry : request.getTranslations().entrySet()) {
                code.getTranslations().add(MasterCodeTranslation.builder()
                        .masterCode(code)
                        .langCode(entry.getKey())
                        .name(entry.getValue())
                        .build());
            }
        }

        MasterCode savedCode = masterCodeRepository.save(code);
        return convertToMasterCodeResponse(savedCode);
    }

    @Transactional
    public void deleteMasterCode(String id) {
        masterCodeRepository.deleteById(id);
    }

    // CRUD for DetailCode
    @Transactional
    public DetailCodeResponse saveDetailCode(DetailCodeResponse request) {
        DetailCode code = detailCodeRepository.findById(request.getId() != null ? request.getId() : -1L)
                .orElse(new DetailCode());

        code.setMasterCodeId(request.getMasterCodeId());
        code.setCode(request.getCode());
        code.setLabel(request.getLabel());
        code.setSortOrder(request.getSortOrder());
        code.setUseYn(request.getUseYn());

        // Update translations
        if (request.getTranslations() != null) {
            code.getTranslations().clear();
            for (Map.Entry<String, String> entry : request.getTranslations().entrySet()) {
                code.getTranslations().add(DetailCodeTranslation.builder()
                        .detailCode(code)
                        .langCode(entry.getKey())
                        .label(entry.getValue())
                        .build());
            }
        }

        DetailCode savedCode = detailCodeRepository.save(code);
        return convertToDetailCodeResponse(savedCode);
    }

    @Transactional
    public void deleteDetailCode(Long id) {
        detailCodeRepository.deleteById(id);
    }

    // CRUD for Menu
    @Transactional
    public MenuResponse saveMenu(MenuResponse request) {
        Menu menu = menuRepository.findById(request.getId() != null ? request.getId() : -1L)
                .orElse(new Menu());

        menu.setParentId(request.getParentId());
        menu.setMenuKey(request.getMenuKey());
        menu.setPath(request.getPath());
        menu.setIcon(request.getIcon());
        menu.setSortOrder(request.getSortOrder());
        menu.setIsVisible(request.getIsVisible());
        menu.setIsPc(request.getIsPc());
        menu.setIsMobile(request.getIsMobile());

        // Update translations
        if (request.getTranslations() != null) {
            menu.getTranslations().clear();
            for (Map.Entry<String, String> entry : request.getTranslations().entrySet()) {
                menu.getTranslations().add(MenuTranslation.builder()
                        .menu(menu)
                        .langCode(entry.getKey())
                        .title(entry.getValue())
                        .build());
            }
        }

        Menu savedMenu = menuRepository.save(menu);
        return convertToMenuResponse(savedMenu);
    }

    @Transactional
    public void deleteMenu(Long id) {
        menuRepository.deleteById(id);
    }

    // CRUD for Message
    @Transactional
    public MessageResponse saveMessage(MessageResponse request) {
        Message message = messageRepository.findById(request.getId() != null ? request.getId() : -1L)
                .orElse(new Message());

        message.setMessageKey(request.getMessageKey());
        message.setCategory(request.getCategory());
        message.setDescription(request.getDescription());

        // Update translations
        if (request.getTranslations() != null) {
            message.getTranslations().clear();
            for (Map.Entry<String, String> entry : request.getTranslations().entrySet()) {
                message.getTranslations().add(MessageTranslation.builder()
                        .message(message)
                        .langCode(entry.getKey())
                        .content(entry.getValue())
                        .build());
            }
        }

        Message savedMessage = messageRepository.save(message);
        return convertToMessageResponse(savedMessage);
    }

    @Transactional
    public void deleteMessage(Long id) {
        messageRepository.deleteById(id);
    }

    public List<Long> getFavoriteMenuIds(String userId) {
        return favoriteMenuRepository.findByUserId(userId).stream()
                .map(FavoriteMenu::getMenuId)
                .collect(Collectors.toList());
    }

    @Transactional
    public void toggleFavorite(String userId, Long menuId) {
        Optional<FavoriteMenu> favorite = favoriteMenuRepository.findByUserIdAndMenuId(userId, menuId);
        if (favorite.isPresent()) {
            favoriteMenuRepository.deleteByUserIdAndMenuId(userId, menuId);
        } else {
            favoriteMenuRepository.save(FavoriteMenu.builder()
                    .userId(userId)
                    .menuId(menuId)
                    .build());
        }
    }

    @Transactional
    public void updateFavorites(String userId, List<Long> menuIds) {
        favoriteMenuRepository.deleteByUserId(userId);

        for (Long menuId : menuIds) {
            favoriteMenuRepository.save(FavoriteMenu.builder()
                    .userId(userId)
                    .menuId(menuId)
                    .build());
        }
    }
}

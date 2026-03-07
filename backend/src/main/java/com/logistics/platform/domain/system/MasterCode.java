package com.logistics.platform.domain.system;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

@Entity
@Table(name = "t_sys_master_codes")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MasterCode {
    @Id
    @Column(name = "id", length = 50)
    private String id;

    @Column(name = "name", nullable = false)
    private String name;

    @Column(name = "description")
    private String description;

    @Builder.Default
    @OneToMany(mappedBy = "masterCode", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    private java.util.List<MasterCodeTranslation> translations = new java.util.ArrayList<>();
}

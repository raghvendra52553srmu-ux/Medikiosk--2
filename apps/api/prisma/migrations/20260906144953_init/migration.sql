-- CreateTable
CREATE TABLE `StaffUser` (
    `id` VARCHAR(191) NOT NULL,
    `username` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `passwordHash` VARCHAR(191) NOT NULL,
    `role` ENUM('DOCTOR', 'ADMIN') NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `department` VARCHAR(191) NULL,
    `qualification` VARCHAR(191) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `doctorId` VARCHAR(191) NULL,
    `lastLoginAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `StaffUser_username_key`(`username`),
    UNIQUE INDEX `StaffUser_email_key`(`email`),
    UNIQUE INDEX `StaffUser_doctorId_key`(`doctorId`),
    INDEX `StaffUser_role_isActive_idx`(`role`, `isActive`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Hospital` (
    `id` VARCHAR(191) NOT NULL,
    `osmType` VARCHAR(191) NOT NULL,
    `osmId` BIGINT NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `address` TEXT NULL,
    `lat` DOUBLE NOT NULL,
    `lon` DOUBLE NOT NULL,
    `phone` VARCHAR(191) NULL,
    `website` TEXT NULL,
    `emergency` BOOLEAN NOT NULL DEFAULT false,
    `specialities` JSON NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Hospital_name_idx`(`name`),
    UNIQUE INDEX `Hospital_osmType_osmId_key`(`osmType`, `osmId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Department` (
    `id` VARCHAR(191) NOT NULL,
    `hospitalId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `Department_hospitalId_idx`(`hospitalId`),
    UNIQUE INDEX `Department_hospitalId_name_key`(`hospitalId`, `name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Doctor` (
    `id` VARCHAR(191) NOT NULL,
    `hospitalId` VARCHAR(191) NOT NULL,
    `departmentId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `qualification` VARCHAR(191) NOT NULL,
    `specialty` VARCHAR(191) NOT NULL,
    `room` VARCHAR(191) NULL,
    `opdStartMin` INTEGER NOT NULL DEFAULT 510,
    `opdEndMin` INTEGER NOT NULL DEFAULT 810,
    `slotMinutes` INTEGER NOT NULL DEFAULT 5,
    `tokenPrefix` VARCHAR(191) NOT NULL DEFAULT 'A',
    `isAvailable` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Doctor_hospitalId_departmentId_idx`(`hospitalId`, `departmentId`),
    INDEX `Doctor_departmentId_isAvailable_idx`(`departmentId`, `isAvailable`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PatientSession` (
    `id` VARCHAR(191) NOT NULL,
    `kioskId` VARCHAR(191) NULL,
    `name` VARCHAR(191) NOT NULL,
    `age` INTEGER NOT NULL,
    `sex` VARCHAR(191) NOT NULL,
    `mobileHash` VARCHAR(191) NOT NULL,
    `mobileLast4` VARCHAR(191) NOT NULL,
    `language` VARCHAR(191) NOT NULL DEFAULT 'en',
    `consentAt` DATETIME(3) NULL,
    `problemText` TEXT NULL,
    `problemPresetId` VARCHAR(191) NULL,
    `status` ENUM('REGISTERED', 'TOKEN_ISSUED', 'HISTORY', 'SUBMITTED', 'CLOSED') NOT NULL DEFAULT 'REGISTERED',
    `expiresAt` DATETIME(3) NOT NULL,
    `deletedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `PatientSession_mobileHash_idx`(`mobileHash`),
    INDEX `PatientSession_status_createdAt_idx`(`status`, `createdAt`),
    INDEX `PatientSession_deletedAt_idx`(`deletedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `QueueToken` (
    `id` VARCHAR(191) NOT NULL,
    `number` VARCHAR(191) NOT NULL,
    `sessionId` VARCHAR(191) NOT NULL,
    `doctorId` VARCHAR(191) NOT NULL,
    `hospitalId` VARCHAR(191) NOT NULL,
    `serviceDate` DATE NOT NULL,
    `sequence` INTEGER NOT NULL,
    `status` ENUM('WAITING', 'ALMOST', 'CALLED', 'IN_CONSULTATION', 'COMPLETED', 'ABSENT') NOT NULL DEFAULT 'WAITING',
    `issuedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `etaAt` DATETIME(3) NULL,
    `calledAt` DATETIME(3) NULL,
    `startedAt` DATETIME(3) NULL,
    `completedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `QueueToken_sessionId_key`(`sessionId`),
    INDEX `QueueToken_doctorId_serviceDate_status_idx`(`doctorId`, `serviceDate`, `status`),
    INDEX `QueueToken_serviceDate_status_idx`(`serviceDate`, `status`),
    UNIQUE INDEX `QueueToken_doctorId_serviceDate_number_key`(`doctorId`, `serviceDate`, `number`),
    UNIQUE INDEX `QueueToken_doctorId_serviceDate_sequence_key`(`doctorId`, `serviceDate`, `sequence`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `HistoryAnswer` (
    `id` VARCHAR(191) NOT NULL,
    `sessionId` VARCHAR(191) NOT NULL,
    `questionId` VARCHAR(191) NOT NULL,
    `value` JSON NOT NULL,
    `answeredAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `HistoryAnswer_sessionId_idx`(`sessionId`),
    UNIQUE INDEX `HistoryAnswer_sessionId_questionId_key`(`sessionId`, `questionId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Document` (
    `id` VARCHAR(191) NOT NULL,
    `sessionId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `type` ENUM('PRESCRIPTION', 'LAB_REPORT', 'DISCHARGE_SUMMARY', 'IMAGING', 'OTHER') NOT NULL DEFAULT 'OTHER',
    `extractedText` MEDIUMTEXT NULL,
    `ocrConfidence` DOUBLE NULL,
    `thumbDataUrl` LONGTEXT NULL,
    `status` ENUM('PROCESSING', 'COMPLETED', 'ERROR') NOT NULL DEFAULT 'COMPLETED',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `Document_sessionId_idx`(`sessionId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ClinicalSummary` (
    `id` VARCHAR(191) NOT NULL,
    `sessionId` VARCHAR(191) NOT NULL,
    `chiefComplaint` TEXT NOT NULL,
    `historyOfPresentIllness` TEXT NOT NULL,
    `pastMedicalHistory` TEXT NOT NULL,
    `medications` JSON NOT NULL,
    `allergies` JSON NOT NULL,
    `familyHistory` TEXT NOT NULL,
    `socialHistory` TEXT NOT NULL,
    `reviewOfSystems` TEXT NOT NULL,
    `status` ENUM('DRAFT', 'REVIEWED', 'VERIFIED') NOT NULL DEFAULT 'DRAFT',
    `version` INTEGER NOT NULL DEFAULT 1,
    `compiledAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `verifiedById` VARCHAR(191) NULL,
    `verifiedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `ClinicalSummary_sessionId_key`(`sessionId`),
    INDEX `ClinicalSummary_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `RedFlag` (
    `id` VARCHAR(191) NOT NULL,
    `summaryId` VARCHAR(191) NOT NULL,
    `finding` VARCHAR(191) NOT NULL,
    `reason` VARCHAR(191) NOT NULL,
    `severity` ENUM('LOW', 'MODERATE', 'HIGH') NOT NULL DEFAULT 'MODERATE',
    `source` VARCHAR(191) NOT NULL DEFAULT 'system-compiled',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `RedFlag_summaryId_idx`(`summaryId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AuditLog` (
    `id` VARCHAR(191) NOT NULL,
    `actorType` ENUM('PATIENT', 'STAFF', 'SYSTEM') NOT NULL,
    `staffId` VARCHAR(191) NULL,
    `sessionId` VARCHAR(191) NULL,
    `action` VARCHAR(191) NOT NULL,
    `entity` VARCHAR(191) NOT NULL,
    `entityId` VARCHAR(191) NULL,
    `meta` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `AuditLog_entity_entityId_idx`(`entity`, `entityId`),
    INDEX `AuditLog_createdAt_idx`(`createdAt`),
    INDEX `AuditLog_sessionId_idx`(`sessionId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `KioskDevice` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `hospitalId` VARCHAR(191) NULL,
    `status` ENUM('ONLINE', 'OFFLINE', 'MAINTENANCE') NOT NULL DEFAULT 'ONLINE',
    `lastSeenAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `KioskDevice_name_key`(`name`),
    INDEX `KioskDevice_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `StaffUser` ADD CONSTRAINT `StaffUser_doctorId_fkey` FOREIGN KEY (`doctorId`) REFERENCES `Doctor`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Department` ADD CONSTRAINT `Department_hospitalId_fkey` FOREIGN KEY (`hospitalId`) REFERENCES `Hospital`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Doctor` ADD CONSTRAINT `Doctor_hospitalId_fkey` FOREIGN KEY (`hospitalId`) REFERENCES `Hospital`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Doctor` ADD CONSTRAINT `Doctor_departmentId_fkey` FOREIGN KEY (`departmentId`) REFERENCES `Department`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PatientSession` ADD CONSTRAINT `PatientSession_kioskId_fkey` FOREIGN KEY (`kioskId`) REFERENCES `KioskDevice`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `QueueToken` ADD CONSTRAINT `QueueToken_sessionId_fkey` FOREIGN KEY (`sessionId`) REFERENCES `PatientSession`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `QueueToken` ADD CONSTRAINT `QueueToken_doctorId_fkey` FOREIGN KEY (`doctorId`) REFERENCES `Doctor`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `QueueToken` ADD CONSTRAINT `QueueToken_hospitalId_fkey` FOREIGN KEY (`hospitalId`) REFERENCES `Hospital`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `HistoryAnswer` ADD CONSTRAINT `HistoryAnswer_sessionId_fkey` FOREIGN KEY (`sessionId`) REFERENCES `PatientSession`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Document` ADD CONSTRAINT `Document_sessionId_fkey` FOREIGN KEY (`sessionId`) REFERENCES `PatientSession`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ClinicalSummary` ADD CONSTRAINT `ClinicalSummary_sessionId_fkey` FOREIGN KEY (`sessionId`) REFERENCES `PatientSession`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ClinicalSummary` ADD CONSTRAINT `ClinicalSummary_verifiedById_fkey` FOREIGN KEY (`verifiedById`) REFERENCES `StaffUser`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `RedFlag` ADD CONSTRAINT `RedFlag_summaryId_fkey` FOREIGN KEY (`summaryId`) REFERENCES `ClinicalSummary`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AuditLog` ADD CONSTRAINT `AuditLog_staffId_fkey` FOREIGN KEY (`staffId`) REFERENCES `StaffUser`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AuditLog` ADD CONSTRAINT `AuditLog_sessionId_fkey` FOREIGN KEY (`sessionId`) REFERENCES `PatientSession`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `KioskDevice` ADD CONSTRAINT `KioskDevice_hospitalId_fkey` FOREIGN KEY (`hospitalId`) REFERENCES `Hospital`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

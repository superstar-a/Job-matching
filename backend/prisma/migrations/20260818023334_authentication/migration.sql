BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[Users] (
    [UserID] UNIQUEIDENTIFIER NOT NULL CONSTRAINT [Users_UserID_df] DEFAULT NEWSEQUENTIALID(),
    [Email] NVARCHAR(255) NOT NULL,
    [Username] NVARCHAR(100) NOT NULL,
    [AccountStatus] VARCHAR(20) NOT NULL CONSTRAINT [Users_AccountStatus_df] DEFAULT 'Active',
    [CreatedAt] DATETIME2 NOT NULL CONSTRAINT [Users_CreatedAt_df] DEFAULT SYSUTCDATETIME(),
    [UpdatedAt] DATETIME2 NOT NULL CONSTRAINT [Users_UpdatedAt_df] DEFAULT SYSUTCDATETIME(),
    CONSTRAINT [Users_pkey] PRIMARY KEY CLUSTERED ([UserID]),
    CONSTRAINT [UQ_Users_Email] UNIQUE NONCLUSTERED ([Email]),
    CONSTRAINT [UQ_Users_Username] UNIQUE NONCLUSTERED ([Username])
);

-- CreateTable
CREATE TABLE [dbo].[Credentials] (
    [CredentialID] UNIQUEIDENTIFIER NOT NULL CONSTRAINT [Credentials_CredentialID_df] DEFAULT NEWSEQUENTIALID(),
    [UserID] UNIQUEIDENTIFIER NOT NULL,
    [AuthProvider] VARCHAR(50) NOT NULL CONSTRAINT [Credentials_AuthProvider_df] DEFAULT 'Local',
    [ProviderKey] VARCHAR(255),
    [PasswordHash] VARCHAR(255),
    [PasswordSalt] VARCHAR(255),
    [LastUpdated] DATETIME2 NOT NULL CONSTRAINT [Credentials_LastUpdated_df] DEFAULT SYSUTCDATETIME(),
    CONSTRAINT [Credentials_pkey] PRIMARY KEY CLUSTERED ([CredentialID]),
    CONSTRAINT [UQ_Credentials_UserProvider] UNIQUE NONCLUSTERED ([UserID],[AuthProvider])
);

-- CreateTable
CREATE TABLE [dbo].[Roles] (
    [RoleID] INT NOT NULL IDENTITY(1,1),
    [RoleName] VARCHAR(50) NOT NULL,
    [Description] NVARCHAR(255),
    CONSTRAINT [Roles_pkey] PRIMARY KEY CLUSTERED ([RoleID]),
    CONSTRAINT [UQ_Roles_RoleName] UNIQUE NONCLUSTERED ([RoleName])
);

-- CreateTable
CREATE TABLE [dbo].[Permissions] (
    [PermissionID] INT NOT NULL IDENTITY(1,1),
    [PermissionName] VARCHAR(100) NOT NULL,
    [Description] NVARCHAR(255),
    CONSTRAINT [Permissions_pkey] PRIMARY KEY CLUSTERED ([PermissionID]),
    CONSTRAINT [UQ_Permissions_PermissionName] UNIQUE NONCLUSTERED ([PermissionName])
);

-- CreateTable
CREATE TABLE [dbo].[RolePermissions] (
    [RoleID] INT NOT NULL,
    [PermissionID] INT NOT NULL,
    CONSTRAINT [RolePermissions_pkey] PRIMARY KEY CLUSTERED ([RoleID],[PermissionID])
);

-- CreateTable
CREATE TABLE [dbo].[UserRoles] (
    [UserID] UNIQUEIDENTIFIER NOT NULL,
    [RoleID] INT NOT NULL,
    [AssignedAt] DATETIME2 NOT NULL CONSTRAINT [UserRoles_AssignedAt_df] DEFAULT SYSUTCDATETIME(),
    CONSTRAINT [UserRoles_pkey] PRIMARY KEY CLUSTERED ([UserID],[RoleID])
);

-- CreateTable
CREATE TABLE [dbo].[Sessions] (
    [SessionID] UNIQUEIDENTIFIER NOT NULL CONSTRAINT [Sessions_SessionID_df] DEFAULT NEWSEQUENTIALID(),
    [UserID] UNIQUEIDENTIFIER NOT NULL,
    [RefreshToken] VARCHAR(512) NOT NULL,
    [IPAddress] VARCHAR(45),
    [UserAgent] NVARCHAR(500),
    [IsRevoked] BIT NOT NULL CONSTRAINT [Sessions_IsRevoked_df] DEFAULT 0,
    [ExpiresAt] DATETIME2 NOT NULL,
    [CreatedAt] DATETIME2 NOT NULL CONSTRAINT [Sessions_CreatedAt_df] DEFAULT SYSUTCDATETIME(),
    CONSTRAINT [Sessions_pkey] PRIMARY KEY CLUSTERED ([SessionID])
);

-- CreateTable
CREATE TABLE [dbo].[SecurityAuditLogs] (
    [LogID] BIGINT NOT NULL IDENTITY(1,1),
    [UserID] UNIQUEIDENTIFIER,
    [EventType] VARCHAR(50) NOT NULL,
    [IPAddress] VARCHAR(45),
    [EventDetails] NVARCHAR(max),
    [CreatedAt] DATETIME2 NOT NULL CONSTRAINT [SecurityAuditLogs_CreatedAt_df] DEFAULT SYSUTCDATETIME(),
    CONSTRAINT [SecurityAuditLogs_pkey] PRIMARY KEY CLUSTERED ([LogID])
);

-- AddForeignKey
ALTER TABLE [dbo].[Credentials] ADD CONSTRAINT [FK_Credentials_Users] FOREIGN KEY ([UserID]) REFERENCES [dbo].[Users]([UserID]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[RolePermissions] ADD CONSTRAINT [FK_RolePermissions_Roles] FOREIGN KEY ([RoleID]) REFERENCES [dbo].[Roles]([RoleID]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[RolePermissions] ADD CONSTRAINT [FK_RolePermissions_Permissions] FOREIGN KEY ([PermissionID]) REFERENCES [dbo].[Permissions]([PermissionID]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[UserRoles] ADD CONSTRAINT [FK_UserRoles_Users] FOREIGN KEY ([UserID]) REFERENCES [dbo].[Users]([UserID]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[UserRoles] ADD CONSTRAINT [FK_UserRoles_Roles] FOREIGN KEY ([RoleID]) REFERENCES [dbo].[Roles]([RoleID]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[Sessions] ADD CONSTRAINT [FK_Sessions_Users] FOREIGN KEY ([UserID]) REFERENCES [dbo].[Users]([UserID]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[SecurityAuditLogs] ADD CONSTRAINT [SecurityAuditLogs_UserID_fkey] FOREIGN KEY ([UserID]) REFERENCES [dbo].[Users]([UserID]) ON DELETE SET NULL ON UPDATE CASCADE;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH

import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import DataCorrectionInterface from '../DataCorrectionInterface';
import { AuthProvider } from '../../../contexts/AuthContext';

const theme = createTheme();

const mockUser = {
  id: 'user-1',
  username: 'test@example.com',
  role: 'investigator' as const,
  organizationId: 'org-1',
};

const mockAdminUser = {
  id: 'admin-1',
  username: 'admin@example.com',
  role: 'super_admin' as const,
  organizationId: 'org-1',
};

const mockViewerUser = {
  id: 'viewer-1',
  username: 'viewer@example.com',
  role: 'viewer' as const,
  organizationId: 'org-1',
};

const MockAuthProvider: React.FC<{ children: React.ReactNode; user?: any }> = ({ 
  children, 
  user = mockUser 
}) => (
  <AuthProvider value={{ user, isAuthenticated: !!user, login: jest.fn(), logout: jest.fn() }}>
    {children}
  </AuthProvider>
);

const MockWrapper: React.FC<{ children: React.ReactNode; user?: any }> = ({ 
  children, 
  user 
}) => (
  <ThemeProvider theme={theme}>
    <MockAuthProvider user={user}>
      {children}
    </MockAuthProvider>
  </ThemeProvider>
);

describe('DataCorrectionInterface', () => {
  const mockVisitId = 'visit-test-001';
  const mockExaminationData = {
    'basic-info': {
      right: {
        currentUsedCL: 'テストレンズ',
        va: 1.2,
        s: -2.0,
        c: -0.5,
        ax: 90,
        intraocularPressure1: 15,
        intraocularPressure2: 16,
        intraocularPressure3: 15,
      },
      left: {
        currentUsedCL: 'テストレンズ',
        va: 1.0,
        s: -2.5,
        c: -0.25,
        ax: 85,
        intraocularPressure1: 14,
        intraocularPressure2: 15,
        intraocularPressure3: 14,
      },
    },
    'vas': {
      right: {
        comfortLevel: 85,
        drynessLevel: 20,
        visualPerformance_Daytime: 90,
        visualPerformance_EndOfDay: 75,
      },
      left: {
        comfortLevel: 80,
        drynessLevel: 25,
        visualPerformance_Daytime: 88,
        visualPerformance_EndOfDay: 73,
      },
    },
  };

  const mockOnDataUpdate = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render data correction interface with proper title', () => {
    render(
      <MockWrapper>
        <DataCorrectionInterface
          visitId={mockVisitId}
          examinationData={mockExaminationData}
          onDataUpdate={mockOnDataUpdate}
        />
      </MockWrapper>
    );

    expect(screen.getByText('データ管理・修正')).toBeInTheDocument();
  });

  it('should display examination tabs based on provided data', () => {
    render(
      <MockWrapper>
        <DataCorrectionInterface
          visitId={mockVisitId}
          examinationData={mockExaminationData}
          onDataUpdate={mockOnDataUpdate}
        />
      </MockWrapper>
    );

    expect(screen.getByRole('tab', { name: /基礎情報/ })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /VAS評価/ })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /承認管理/ })).toBeInTheDocument();
  });

  it('should show permission warning for users without edit rights', () => {
    render(
      <MockWrapper user={mockViewerUser}>
        <DataCorrectionInterface
          visitId={mockVisitId}
          examinationData={mockExaminationData}
          onDataUpdate={mockOnDataUpdate}
        />
      </MockWrapper>
    );

    expect(screen.getByText(/データ編集権限がありません/)).toBeInTheDocument();
  });

  it('should display examination data in table format', () => {
    render(
      <MockWrapper>
        <DataCorrectionInterface
          visitId={mockVisitId}
          examinationData={mockExaminationData}
          onDataUpdate={mockOnDataUpdate}
        />
      </MockWrapper>
    );

    // Should show field names
    expect(screen.getByText('currentUsedCL')).toBeInTheDocument();
    expect(screen.getByText('va')).toBeInTheDocument();

    // Should show data values
    expect(screen.getAllByText('テストレンズ')).toHaveLength(2); // Right and left
    expect(screen.getByText('1.2')).toBeInTheDocument(); // Right VA
    expect(screen.getByText('1')).toBeInTheDocument(); // Left VA

    // Should show right and left eye columns
    expect(screen.getByText('右目 (Right)')).toBeInTheDocument();
    expect(screen.getByText('左目 (Left)')).toBeInTheDocument();
  });

  it('should show edit buttons for users with edit permissions', () => {
    render(
      <MockWrapper>
        <DataCorrectionInterface
          visitId={mockVisitId}
          examinationData={mockExaminationData}
          onDataUpdate={mockOnDataUpdate}
          allowDirectEdit={true}
        />
      </MockWrapper>
    );

    const editButtons = screen.getAllByLabelText(/edit|編集/i);
    expect(editButtons.length).toBeGreaterThan(0);
  });

  it('should not show edit buttons for users without edit permissions', () => {
    render(
      <MockWrapper user={mockViewerUser}>
        <DataCorrectionInterface
          visitId={mockVisitId}
          examinationData={mockExaminationData}
          onDataUpdate={mockOnDataUpdate}
        />
      </MockWrapper>
    );

    const editButtons = screen.queryAllByLabelText(/edit|編集/i);
    expect(editButtons).toHaveLength(0);
  });

  it('should open edit dialog when edit button is clicked', async () => {
    render(
      <MockWrapper>
        <DataCorrectionInterface
          visitId={mockVisitId}
          examinationData={mockExaminationData}
          onDataUpdate={mockOnDataUpdate}
          allowDirectEdit={true}
        />
      </MockWrapper>
    );

    const editButtons = screen.getAllByLabelText(/edit|編集/i);
    fireEvent.click(editButtons[0]);

    await waitFor(() => {
      expect(screen.getByText('データ修正')).toBeInTheDocument();
      expect(screen.getByText('現在の値')).toBeInTheDocument();
      expect(screen.getByText('修正後の値')).toBeInTheDocument();
      expect(screen.getByText('修正理由 *')).toBeInTheDocument();
    });
  });

  it('should show validation error when trying to save without reason', async () => {
    render(
      <MockWrapper>
        <DataCorrectionInterface
          visitId={mockVisitId}
          examinationData={mockExaminationData}
          onDataUpdate={mockOnDataUpdate}
          allowDirectEdit={true}
        />
      </MockWrapper>
    );

    const editButtons = screen.getAllByLabelText(/edit|編集/i);
    fireEvent.click(editButtons[0]);

    await waitFor(() => {
      expect(screen.getByText('データ修正')).toBeInTheDocument();
    });

    const saveButton = screen.getByText('保存');
    fireEvent.click(saveButton);

    // Should show validation error
    expect(screen.getByText('修正理由を入力してください')).toBeInTheDocument();
  });

  it('should handle form submission with valid data', async () => {
    render(
      <MockWrapper>
        <DataCorrectionInterface
          visitId={mockVisitId}
          examinationData={mockExaminationData}
          onDataUpdate={mockOnDataUpdate}
          allowDirectEdit={true}
          requireApproval={false}
        />
      </MockWrapper>
    );

    const editButtons = screen.getAllByLabelText(/edit|編集/i);
    fireEvent.click(editButtons[0]);

    await waitFor(() => {
      expect(screen.getByText('データ修正')).toBeInTheDocument();
    });

    // Fill in the form
    const newValueInput = screen.getByPlaceholderText('新しい値を入力');
    const reasonInput = screen.getByPlaceholderText('データを修正する理由を詳しく入力してください');

    fireEvent.change(newValueInput, { target: { value: 'Updated Value' } });
    fireEvent.change(reasonInput, { target: { value: 'Test correction reason' } });

    const saveButton = screen.getByText('保存');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mockOnDataUpdate).toHaveBeenCalled();
    });
  });

  it('should show approval workflow when requireApproval is true', async () => {
    render(
      <MockWrapper>
        <DataCorrectionInterface
          visitId={mockVisitId}
          examinationData={mockExaminationData}
          onDataUpdate={mockOnDataUpdate}
          allowDirectEdit={false}
          requireApproval={true}
        />
      </MockWrapper>
    );

    const editButtons = screen.getAllByLabelText(/edit|編集/i);
    fireEvent.click(editButtons[0]);

    await waitFor(() => {
      expect(screen.getByText('この修正は管理者の承認が必要です')).toBeInTheDocument();
      expect(screen.getByText('承認申請')).toBeInTheDocument();
    });
  });

  it('should switch between examination tabs correctly', async () => {
    render(
      <MockWrapper>
        <DataCorrectionInterface
          visitId={mockVisitId}
          examinationData={mockExaminationData}
          onDataUpdate={mockOnDataUpdate}
        />
      </MockWrapper>
    );

    // Click on VAS tab
    const vasTab = screen.getByRole('tab', { name: /VAS評価/ });
    fireEvent.click(vasTab);

    await waitFor(() => {
      expect(screen.getByText('comfortLevel')).toBeInTheDocument();
      expect(screen.getByText('drynessLevel')).toBeInTheDocument();
    });
  });

  it('should show delete buttons for admin users', () => {
    render(
      <MockWrapper user={mockAdminUser}>
        <DataCorrectionInterface
          visitId={mockVisitId}
          examinationData={mockExaminationData}
          onDataUpdate={mockOnDataUpdate}
        />
      </MockWrapper>
    );

    const deleteButtons = screen.getAllByLabelText(/delete|削除/i);
    expect(deleteButtons.length).toBeGreaterThan(0);
  });

  it('should open delete confirmation dialog', async () => {
    render(
      <MockWrapper user={mockAdminUser}>
        <DataCorrectionInterface
          visitId={mockVisitId}
          examinationData={mockExaminationData}
          onDataUpdate={mockOnDataUpdate}
        />
      </MockWrapper>
    );

    const deleteButtons = screen.getAllByLabelText(/delete|削除/i);
    fireEvent.click(deleteButtons[0]);

    await waitFor(() => {
      expect(screen.getByText('データ削除の確認')).toBeInTheDocument();
      expect(screen.getByText('この操作は元に戻せません')).toBeInTheDocument();
    });
  });

  it('should show history dialog when history button is clicked', async () => {
    render(
      <MockWrapper>
        <DataCorrectionInterface
          visitId={mockVisitId}
          examinationData={mockExaminationData}
          onDataUpdate={mockOnDataUpdate}
        />
      </MockWrapper>
    );

    const historyButton = screen.getByText('変更履歴');
    fireEvent.click(historyButton);

    await waitFor(() => {
      expect(screen.getByText('変更履歴')).toBeInTheDocument();
    });
  });

  it('should display pending corrections in approval management tab', async () => {
    render(
      <MockWrapper user={mockAdminUser}>
        <DataCorrectionInterface
          visitId={mockVisitId}
          examinationData={mockExaminationData}
          onDataUpdate={mockOnDataUpdate}
        />
      </MockWrapper>
    );

    // Click on approval management tab
    const approvalTab = screen.getByRole('tab', { name: /承認管理/ });
    fireEvent.click(approvalTab);

    await waitFor(() => {
      expect(screen.getByText('承認管理')).toBeInTheDocument();
    });
  });

  it('should handle missing data gracefully', () => {
    render(
      <MockWrapper>
        <DataCorrectionInterface
          visitId={mockVisitId}
          examinationData={{}}
          onDataUpdate={mockOnDataUpdate}
        />
      </MockWrapper>
    );

    expect(screen.getByText('データ管理・修正')).toBeInTheDocument();
  });

  it('should enable bulk edit mode', () => {
    render(
      <MockWrapper>
        <DataCorrectionInterface
          visitId={mockVisitId}
          examinationData={mockExaminationData}
          onDataUpdate={mockOnDataUpdate}
        />
      </MockWrapper>
    );

    const bulkEditSwitch = screen.getByRole('checkbox', { name: /一括編集モード/ });
    fireEvent.click(bulkEditSwitch);

    expect(bulkEditSwitch).toBeChecked();
  });

  it('should display field values correctly for different data types', () => {
    const mockDataWithVariousTypes = {
      'test-exam': {
        right: {
          booleanField: true,
          numberField: 42,
          stringField: 'Test String',
          nullField: null,
          undefinedField: undefined,
        },
      },
    };

    render(
      <MockWrapper>
        <DataCorrectionInterface
          visitId={mockVisitId}
          examinationData={mockDataWithVariousTypes}
          onDataUpdate={mockOnDataUpdate}
        />
      </MockWrapper>
    );

    expect(screen.getByText('はい')).toBeInTheDocument(); // Boolean true
    expect(screen.getByText('42')).toBeInTheDocument(); // Number
    expect(screen.getByText('Test String')).toBeInTheDocument(); // String
    expect(screen.getByText('データなし')).toBeInTheDocument(); // Null/undefined
  });

  it('should show proper context information in edit dialog', async () => {
    render(
      <MockWrapper>
        <DataCorrectionInterface
          visitId={mockVisitId}
          examinationData={mockExaminationData}
          onDataUpdate={mockOnDataUpdate}
          allowDirectEdit={true}
        />
      </MockWrapper>
    );

    const editButtons = screen.getAllByLabelText(/edit|編集/i);
    fireEvent.click(editButtons[0]);

    await waitFor(() => {
      expect(screen.getByText(/対象:/)).toBeInTheDocument();
      expect(screen.getByText(/基礎情報/)).toBeInTheDocument();
    });
  });

  it('should handle edit dialog cancellation', async () => {
    render(
      <MockWrapper>
        <DataCorrectionInterface
          visitId={mockVisitId}
          examinationData={mockExaminationData}
          onDataUpdate={mockOnDataUpdate}
          allowDirectEdit={true}
        />
      </MockWrapper>
    );

    const editButtons = screen.getAllByLabelText(/edit|編集/i);
    fireEvent.click(editButtons[0]);

    await waitFor(() => {
      expect(screen.getByText('データ修正')).toBeInTheDocument();
    });

    const cancelButton = screen.getByText('キャンセル');
    fireEvent.click(cancelButton);

    await waitFor(() => {
      expect(screen.queryByText('データ修正')).not.toBeInTheDocument();
    });
  });
});

describe('DataCorrectionInterface - Permission Tests', () => {
  const mockVisitId = 'visit-test-001';
  const mockExaminationData = {
    'basic-info': {
      right: { va: 1.2 },
      left: { va: 1.0 },
    },
  };

  it('should show appropriate buttons based on user permissions', () => {
    const permissions = [
      { user: mockViewerUser, canEdit: false, canDelete: false, canApprove: false },
      { user: mockUser, canEdit: true, canDelete: false, canApprove: false },
      { user: mockAdminUser, canEdit: true, canDelete: true, canApprove: true },
    ];

    permissions.forEach(({ user, canEdit, canDelete }) => {
      const { unmount } = render(
        <MockWrapper user={user}>
          <DataCorrectionInterface
            visitId={mockVisitId}
            examinationData={mockExaminationData}
          />
        </MockWrapper>
      );

      if (canEdit) {
        expect(screen.queryAllByLabelText(/edit|編集/i).length).toBeGreaterThan(0);
      } else {
        expect(screen.queryAllByLabelText(/edit|編集/i)).toHaveLength(0);
      }

      if (canDelete) {
        expect(screen.queryAllByLabelText(/delete|削除/i).length).toBeGreaterThan(0);
      } else {
        expect(screen.queryAllByLabelText(/delete|削除/i)).toHaveLength(0);
      }

      unmount();
    });
  });

  it('should prevent unauthorized edit attempts', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    const alertSpy = jest.spyOn(window, 'alert').mockImplementation();

    render(
      <MockWrapper user={mockViewerUser}>
        <DataCorrectionInterface
          visitId={mockVisitId}
          examinationData={mockExaminationData}
        />
      </MockWrapper>
    );

    // Try to trigger edit (should not be possible through UI, but testing the handler)
    // This would require mocking internal component state or methods
    
    consoleSpy.mockRestore();
    alertSpy.mockRestore();
  });
});
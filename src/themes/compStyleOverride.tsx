// material-ui
import { alpha, Theme } from '@mui/material/styles';

// project imports
import componentsOverrides from './overrides';
import { ThemeMode } from 'config';

export default function componentStyleOverrides(theme: Theme, borderRadius: number, outlinedFilled: boolean) {
  const mode = theme.palette.mode;
  const bgColor = mode === ThemeMode.DARK ? theme.palette.dark[800] : theme.palette.grey[50];
  const menuSelectedBack = mode === ThemeMode.DARK ? alpha(theme.palette.secondary.main, 0.15) : theme.palette.secondary.light;
  const menuSelected = mode === ThemeMode.DARK ? theme.palette.secondary.main : theme.palette.secondary.dark;

  return {
    MuiButton: {
      styleOverrides: {
        root: {
          fontWeight: 500,
          borderRadius: '4px',
          ...theme.applyStyles('dark', {
            '&.MuiButton-colorWarning': { color: theme.palette.common.black }
          })
        }
      }
    },
    MuiCheckbox: {
      styleOverrides: {
        root: {
          '& + .MuiFormControlLabel-label': {
            marginTop: 2
          }
        }
      }
    },
    MuiPaper: {
      defaultProps: {
        elevation: 0
      },
      styleOverrides: {
        root: {
          backgroundImage: 'none'
        },
        rounded: {
          borderRadius: `${borderRadius}px`
        }
      }
    },
    MuiCardHeader: {
      styleOverrides: {
        root: {
          color: theme.palette.text.dark,
          padding: '24px'
        },
        title: {
          fontSize: '1.125rem'
        }
      }
    },
    MuiCardContent: {
      styleOverrides: {
        root: {
          padding: '24px'
        }
      }
    },
    MuiCardActions: {
      styleOverrides: {
        root: {
          padding: '24px'
        }
      }
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          alignItems: 'center'
        },
        outlined: {
          border: '1px dashed'
        }
      }
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          color: theme.palette.text.primary,
          paddingTop: '10px',
          paddingBottom: '10px',
          '&.Mui-selected': {
            color: menuSelected,
            backgroundColor: menuSelectedBack,
            '&:hover': {
              backgroundColor: menuSelectedBack
            },
            '& .MuiListItemIcon-root': {
              color: menuSelected
            }
          },
          '&:hover': {
            backgroundColor: menuSelectedBack,
            color: menuSelected,
            '& .MuiListItemIcon-root': {
              color: menuSelected
            }
          }
        }
      }
    },
    MuiListItemIcon: {
      styleOverrides: {
        root: {
          color: theme.palette.text.primary,
          minWidth: '36px'
        }
      }
    },
    MuiListItemText: {
      styleOverrides: {
        primary: {
          color: theme.palette.text.dark
        }
      }
    },
    MuiInputBase: {
      styleOverrides: {
        input: {
          color: theme.palette.text.dark,
          '&::placeholder': {
            color: theme.palette.text.secondary,
            fontSize: '0.875rem'
          }
        }
      }
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          background: outlinedFilled ? bgColor : 'transparent',
          borderRadius: `${borderRadius}px`,
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: mode === ThemeMode.DARK ? alpha(theme.palette.text.primary, 0.28) : theme.palette.grey[400]
          },
          '&:hover $notchedOutline': {
            borderColor: theme.palette.primary.light
          },
          '&.MuiInputBase-multiline': {
            padding: 1
          }
        },
        input: {
          fontWeight: 500,
          background: outlinedFilled ? bgColor : 'transparent',
          padding: '15.5px 14px',
          borderRadius: `${borderRadius}px`,
          '&.MuiInputBase-inputSizeSmall': {
            padding: '10px 14px',
            '&.MuiInputBase-inputAdornedStart': {
              paddingLeft: 0
            }
          }
        },
        inputAdornedStart: {
          paddingLeft: 4
        },
        notchedOutline: {
          borderRadius: `${borderRadius}px`
        }
      }
    },
    MuiSlider: {
      styleOverrides: {
        root: {
          '&.Mui-disabled': {
            color: mode === ThemeMode.DARK ? alpha(theme.palette.text.primary, 0.5) : theme.palette.grey[300]
          }
        },
        mark: {
          backgroundColor: theme.palette.background.paper,
          width: '4px'
        },
        valueLabel: {
          color: mode === ThemeMode.DARK ? theme.palette.primary.main : theme.palette.primary.light
        }
      }
    },
    MuiAutocomplete: {
      styleOverrides: {
        root: {
          '& .MuiAutocomplete-tag': {
            background: mode === ThemeMode.DARK ? alpha(theme.palette.text.primary, 0.2) : theme.palette.secondary.light,
            borderRadius: 4,
            color: theme.palette.text.dark,
            '.MuiChip-deleteIcon': {
              color: mode === ThemeMode.DARK ? alpha(theme.palette.text.primary, 0.8) : theme.palette.secondary[200]
            }
          }
        },
        popper: {
          borderRadius: `${borderRadius}px`,
          boxShadow: '0px 8px 10px -5px rgb(0 0 0 / 20%), 0px 16px 24px 2px rgb(0 0 0 / 14%), 0px 6px 30px 5px rgb(0 0 0 / 12%)'
        }
      }
    },
    MuiDivider: {
      styleOverrides: {
        root: {
          borderColor: theme.palette.divider
        }
      }
    },
    MuiSelect: {
      styleOverrides: {
        select: {
          '&:focus': {
            backgroundColor: 'transparent'
          }
        }
      }
    },
    MuiAvatar: {
      styleOverrides: {
        root: {
          color: mode === ThemeMode.DARK ? theme.palette.dark.main : theme.palette.primary.dark,
          background: mode === ThemeMode.DARK ? theme.palette.text.primary : theme.palette.primary[200]
        }
      }
    },
    MuiTimelineContent: {
      styleOverrides: {
        root: {
          color: theme.palette.text.dark,
          fontSize: '16px'
        }
      }
    },
    MuiTreeItem: {
      styleOverrides: {
        label: {
          marginTop: 14,
          marginBottom: 14
        }
      }
    },
    MuiTimelineDot: {
      styleOverrides: {
        root: {
          boxShadow: 'none'
        }
      }
    },
    MuiInternalDateTimePickerTabs: {
      styleOverrides: {
        tabs: {
          backgroundColor: mode === ThemeMode.DARK ? theme.palette.dark[900] : theme.palette.primary.light,
          '& .MuiTabs-flexContainer': {
            borderColor: mode === ThemeMode.DARK ? alpha(theme.palette.text.primary, 0.2) : theme.palette.primary[200]
          },
          '& .MuiTab-root': {
            color: mode === ThemeMode.DARK ? theme.palette.text.secondary : theme.palette.grey[900]
          },
          '& .MuiTabs-indicator': {
            backgroundColor: theme.palette.primary.dark
          },
          '& .Mui-selected': {
            color: theme.palette.primary.dark
          }
        }
      }
    },
    MuiTabs: {
      styleOverrides: {
        flexContainer: {
          borderBottom: '1px solid',
          borderColor: mode === ThemeMode.DARK ? alpha(theme.palette.text.primary, 0.2) : theme.palette.grey[200]
        }
      }
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          padding: '12px 0 12px 0'
        }
      }
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderColor: mode === ThemeMode.DARK ? alpha(theme.palette.text.primary, 0.15) : theme.palette.grey[200],
          '&.MuiTableCell-head': {
            fontSize: '0.875rem',
            color: mode === ThemeMode.DARK ? theme.palette.grey[600] : theme.palette.grey[900],
            fontWeight: 500
          }
        }
      }
    },
    MuiDateTimePickerToolbar: {
      styleOverrides: {
        timeDigitsContainer: {
          alignItems: 'center'
        }
      }
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          margin: 0,
          lineHeight: 1.4,
          color: theme.palette.background.paper,
          background: theme.palette.text.primary
        }
      }
    },
    MuiDialogTitle: {
      styleOverrides: {
        root: {
          fontSize: '1.25rem'
        }
      }
    },
    MuiPaginationItem: {
      styleOverrides: {
        root: {
          margin: '3px'
        }
      }
    },
    MuiDataGrid: {
      defaultProps: {
        rowHeight: 54
      },
      styleOverrides: {
        root: {
          borderWidth: 0,
          '& .MuiDataGrid-columnHeader--filledGroup': {
            borderBottomWidth: 0
          },
          '& .MuiDataGrid-columnHeader--emptyGroup': {
            borderBottomWidth: 0
          },
          '& .MuiFormControl-root>.MuiInputBase-root': {
            backgroundColor: `${theme.palette.background.default} !important`,
            borderColor:
              mode === ThemeMode.DARK ? `${alpha(theme.palette.divider, 0.05)} !important` : `${theme.palette.divider} !important`
          }
        },
        withBorderColor: {
          borderColor: mode === ThemeMode.DARK ? alpha(theme.palette.divider, 0.15) : theme.palette.divider
        },
        toolbarContainer: {
          '& .MuiButton-root': {
            paddingLeft: '16px !important',
            paddingRight: '16px !important'
          }
        },
        columnHeader: {
          color: theme.palette.grey[600],
          paddingLeft: 24,
          paddingRight: 24
        },
        footerContainer: {
          '&.MuiDataGrid-withBorderColor': {
            borderBottom: 'none'
          }
        },
        columnHeaderCheckbox: {
          paddingLeft: 0,
          paddingRight: 0
        },
        cellCheckbox: {
          paddingLeft: 0,
          paddingRight: 0
        },
        cell: {
          borderWidth: 1,
          paddingLeft: 24,
          paddingRight: 24,
          borderColor: mode === ThemeMode.DARK ? alpha(theme.palette.divider, 0.15) : theme.palette.divider,
          '&.MuiDataGrid-cell--withRenderer > div ': {
            ...(mode === ThemeMode.DARK && {
              color: theme.palette.grey[50]
            }),
            ' > .high': {
              background: mode === ThemeMode.DARK ? theme.palette.success.dark : theme.palette.success.light
            },
            '& > .medium': {
              background: mode === ThemeMode.DARK ? theme.palette.warning.dark : theme.palette.warning.light
            },
            '& > .low': {
              background: mode === ThemeMode.DARK ? theme.palette.error.dark : theme.palette.error.light
            }
          }
        }
      }
    },
    ...componentsOverrides(theme)
  };
}

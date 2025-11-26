import React, { createContext, useContext, useState, useEffect } from 'react';
import { createTheme, ThemeProvider as MuiThemeProvider } from '@mui/material/styles';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};

const getTheme = (mode) => {
  const isDark = mode === 'dark';
  
  return createTheme({
    palette: {
      mode,
      primary: {
        main: isDark ? '#58a6ff' : '#0969da',
        light: isDark ? '#79c0ff' : '#218bff',
        dark: isDark ? '#388bfd' : '#0550ae',
        contrastText: '#ffffff'
      },
      secondary: {
        main: isDark ? '#8b949e' : '#656d76',
        light: isDark ? '#b1bac4' : '#8b949e',
        dark: isDark ? '#6e7681' : '#424a53'
      },
      background: {
        default: isDark ? '#0d1117' : '#ffffff',
        paper: isDark ? '#161b22' : '#f6f8fa',
        defaultChannel: isDark ? '13 17 23' : '255 255 255'
      },
      text: {
        primary: isDark ? '#e6edf3' : '#24292f',
        secondary: isDark ? '#b1bac4' : '#57606a',
        disabled: isDark ? '#6e7681' : '#8b949e'
      },
      divider: isDark ? '#30363d' : '#d0d7de',
      success: {
        main: isDark ? '#3fb950' : '#1a7f37',
        light: isDark ? '#56d364' : '#2da44e',
        dark: isDark ? '#2ea043' : '#0e5e24'
      },
      warning: {
        main: isDark ? '#d29922' : '#9a6700',
        light: isDark ? '#e3b341' : '#bf8700',
        dark: isDark ? '#bb8009' : '#7c5a00'
      },
      error: {
        main: isDark ? '#f85149' : '#cf222e',
        light: isDark ? '#ff6b6b' : '#da3633',
        dark: isDark ? '#da3633' : '#a40e26'
      },
      info: {
        main: isDark ? '#58a6ff' : '#0969da',
        light: isDark ? '#79c0ff' : '#218bff',
        dark: isDark ? '#388bfd' : '#0550ae'
      }
    },
    shape: {
      borderRadius: 6
    },
    typography: {
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans", Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji"',
      h1: {
        fontWeight: 600,
        fontSize: '2rem',
        lineHeight: 1.25
      },
      h2: {
        fontWeight: 600,
        fontSize: '1.5rem',
        lineHeight: 1.25
      },
      h3: {
        fontWeight: 600,
        fontSize: '1.25rem',
        lineHeight: 1.25
      },
      h4: {
        fontWeight: 600,
        fontSize: '1rem',
        lineHeight: 1.5
      },
      button: {
        textTransform: 'none',
        fontWeight: 500
      }
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 6,
            padding: '5px 16px',
            fontSize: '14px',
            fontWeight: 500,
            boxShadow: 'none',
            '&:hover': {
              boxShadow: 'none'
            }
          },
          contained: {
            backgroundColor: isDark ? '#58a6ff' : '#0969da',
            color: '#ffffff',
            '&:hover': {
              backgroundColor: isDark ? '#79c0ff' : '#0860ca'
            },
            '&:disabled': {
              backgroundColor: isDark ? '#21262d' : '#d0d7de',
              color: isDark ? '#6e7681' : '#8b949e'
            }
          },
          outlined: {
            borderColor: isDark ? '#30363d' : '#d0d7de',
            color: isDark ? '#e6edf3' : '#24292f',
            backgroundColor: isDark ? '#161b22' : '#ffffff',
            '&:hover': {
              backgroundColor: isDark ? '#21262d' : '#f6f8fa',
              borderColor: isDark ? '#484f58' : '#8b949e'
            },
            '&:disabled': {
              borderColor: isDark ? '#21262d' : '#d0d7de',
              color: isDark ? '#6e7681' : '#8b949e'
            }
          },
          text: {
            color: isDark ? '#58a6ff' : '#0969da',
            '&:hover': {
              backgroundColor: isDark ? 'rgba(88, 166, 255, 0.1)' : 'rgba(9, 105, 218, 0.1)'
            }
          }
        }
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 6,
            border: `1px solid ${isDark ? '#30363d' : '#d0d7de'}`,
            boxShadow: 'none',
            backgroundColor: isDark ? '#161b22' : '#ffffff',
            '&:hover': {
              boxShadow: isDark 
                ? '0 1px 3px rgba(0, 0, 0, 0.3), 0 1px 2px rgba(0, 0, 0, 0.4)'
                : '0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24)'
            }
          }
        }
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            '& .MuiOutlinedInput-root': {
              borderRadius: 6,
              backgroundColor: isDark ? '#0d1117' : '#ffffff',
              color: isDark ? '#e6edf3' : '#24292f',
              '& fieldset': {
                borderColor: isDark ? '#30363d' : '#d0d7de'
              },
              '&:hover fieldset': {
                borderColor: isDark ? '#484f58' : '#8b949e'
              },
              '&.Mui-focused fieldset': {
                borderColor: isDark ? '#58a6ff' : '#0969da',
                borderWidth: '1px'
              },
              '& input': {
                color: isDark ? '#e6edf3' : '#24292f',
                '&::placeholder': {
                  color: isDark ? '#6e7681' : '#8b949e',
                  opacity: 1
                }
              },
              '& textarea': {
                color: isDark ? '#e6edf3' : '#24292f',
                '&::placeholder': {
                  color: isDark ? '#6e7681' : '#8b949e',
                  opacity: 1
                }
              }
            },
            '& .MuiInputLabel-root': {
              color: isDark ? '#b1bac4' : '#57606a',
              '&.Mui-focused': {
                color: isDark ? '#58a6ff' : '#0969da'
              }
            }
          }
        }
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            borderRadius: 6,
            border: `1px solid ${isDark ? '#30363d' : '#d0d7de'}`,
            boxShadow: 'none',
            backgroundColor: isDark ? '#161b22' : '#ffffff'
          },
          elevation1: {
            boxShadow: isDark
              ? '0 1px 3px rgba(0, 0, 0, 0.3), 0 1px 2px rgba(0, 0, 0, 0.4)'
              : '0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24)'
          },
          elevation3: {
            boxShadow: isDark
              ? '0 3px 6px rgba(0, 0, 0, 0.4), 0 3px 6px rgba(0, 0, 0, 0.5)'
              : '0 3px 6px rgba(0, 0, 0, 0.16), 0 3px 6px rgba(0, 0, 0, 0.23)'
          }
        }
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            backgroundColor: isDark ? '#161b22' : '#ffffff',
            borderBottom: `1px solid ${isDark ? '#30363d' : '#d0d7de'}`,
            boxShadow: 'none',
            color: isDark ? '#e6edf3' : '#24292f'
          }
        }
      },
      MuiTypography: {
        styleOverrides: {
          root: {
            color: isDark ? '#e6edf3' : '#24292f',
            '&.MuiTypography-body2': {
              color: isDark ? '#b1bac4' : '#57606a'
            },
            '&.MuiTypography-caption': {
              color: isDark ? '#8b949e' : '#57606a'
            }
          }
        }
      },
      MuiListItem: {
        styleOverrides: {
          root: {
            color: isDark ? '#e6edf3' : '#24292f',
            '&:hover': {
              backgroundColor: isDark ? 'rgba(177, 186, 196, 0.08)' : 'rgba(0, 0, 0, 0.04)'
            }
          }
        }
      },
      MuiListItemText: {
        styleOverrides: {
          primary: {
            color: isDark ? '#e6edf3' : '#24292f'
          },
          secondary: {
            color: isDark ? '#b1bac4' : '#57606a'
          }
        }
      },
      MuiDialog: {
        styleOverrides: {
          paper: {
            backgroundColor: isDark ? '#161b22' : '#ffffff',
            border: `1px solid ${isDark ? '#30363d' : '#d0d7de'}`
          }
        }
      },
      MuiDialogTitle: {
        styleOverrides: {
          root: {
            color: isDark ? '#e6edf3' : '#24292f',
            borderBottom: isDark ? '1px solid #30363d' : '1px solid #d0d7de'
          }
        }
      },
      MuiDialogContent: {
        styleOverrides: {
          root: {
            color: isDark ? '#e6edf3' : '#24292f'
          }
        }
      },
      MuiChip: {
        styleOverrides: {
          root: {
            borderRadius: 12,
            fontSize: '12px',
            height: '20px',
            fontWeight: 500,
            color: isDark ? '#e6edf3' : '#24292f',
            backgroundColor: isDark ? '#21262d' : '#f6f8fa',
            borderColor: isDark ? '#30363d' : '#d0d7de',
            '&.MuiChip-outlined': {
              borderColor: isDark ? '#30363d' : '#d0d7de',
              color: isDark ? '#e6edf3' : '#24292f'
            }
          }
        }
      },
      MuiDivider: {
        styleOverrides: {
          root: {
            borderColor: isDark ? '#30363d' : '#d0d7de'
          }
        }
      },
      MuiCheckbox: {
        styleOverrides: {
          root: {
            color: isDark ? '#8b949e' : '#57606a',
            '&.Mui-checked': {
              color: isDark ? '#58a6ff' : '#0969da'
            }
          }
        }
      },
      MuiRating: {
        styleOverrides: {
          root: {
            color: isDark ? '#58a6ff' : '#faaf00'
          }
        }
      },
      MuiSlider: {
        styleOverrides: {
          root: {
            color: isDark ? '#58a6ff' : '#0969da',
            '& .MuiSlider-thumb': {
              backgroundColor: isDark ? '#58a6ff' : '#0969da'
            },
            '& .MuiSlider-track': {
              backgroundColor: isDark ? '#58a6ff' : '#0969da'
            }
          }
        }
      },
      MuiLinearProgress: {
        styleOverrides: {
          root: {
            backgroundColor: isDark ? '#21262d' : '#e1e4e8',
            '& .MuiLinearProgress-bar': {
              backgroundColor: isDark ? '#3fb950' : '#0969da'
            }
          }
        }
      },
      MuiAvatar: {
        styleOverrides: {
          root: {
            backgroundColor: isDark ? '#58a6ff' : '#0969da',
            color: '#ffffff'
          }
        }
      },
      MuiIconButton: {
        styleOverrides: {
          root: {
            color: isDark ? '#e6edf3' : '#24292f',
            '&:hover': {
              backgroundColor: isDark ? 'rgba(177, 186, 196, 0.1)' : 'rgba(0, 0, 0, 0.04)'
            }
          }
        }
      }
    }
  });
};

export const ThemeProvider = ({ children }) => {
  const [mode, setMode] = useState(() => {
    const savedMode = localStorage.getItem('themeMode');
    return savedMode || 'light';
  });

  useEffect(() => {
    localStorage.setItem('themeMode', mode);
  }, [mode]);

  const toggleTheme = () => {
    setMode((prevMode) => (prevMode === 'light' ? 'dark' : 'light'));
  };

  const theme = getTheme(mode);

  return (
    <ThemeContext.Provider value={{ mode, toggleTheme }}>
      <MuiThemeProvider theme={theme}>
        {children}
      </MuiThemeProvider>
    </ThemeContext.Provider>
  );
};


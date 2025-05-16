// material-ui
import { alpha, createTheme } from '@mui/material/styles';

// project imports
import { ThemeMode } from 'config';

// assets
import defaultColor from 'assets/scss/_themes-vars.module.scss';
import theme1 from 'assets/scss/_theme1.module.scss';
import theme2 from 'assets/scss/_theme2.module.scss';
import theme3 from 'assets/scss/_theme3.module.scss';
import theme4 from 'assets/scss/_theme4.module.scss';
import theme5 from 'assets/scss/_theme5.module.scss';
import theme6 from 'assets/scss/_theme6.module.scss';

// types
import { ColorProps } from 'types';
import { PresetColor } from 'types/config';

// ==============================|| DEFAULT THEME - PALETTE ||============================== //

export default function Palette(mode: ThemeMode, presetColor: PresetColor) {
  let colors: ColorProps;
  switch (presetColor) {
    case 'theme1':
      colors = theme1;
      break;
    case 'theme2':
      colors = theme2;
      break;
    case 'theme3':
      colors = theme3;
      break;
    case 'theme4':
      colors = theme4;
      break;
    case 'theme5':
      colors = theme5;
      break;
    case 'theme6':
      colors = theme6;
      break;
    case 'default':
    default:
      colors = defaultColor;
  }

  return createTheme({
    palette: {
      mode,
      common: {
        black: colors.darkPaper
      },
      primary: {
        light: mode === ThemeMode.DARK ? colors.darkPrimaryLight : colors.primaryLight,
        main: mode === ThemeMode.DARK ? colors.darkPrimaryMain : colors.primaryMain,
        dark: mode === ThemeMode.DARK ? colors.darkPrimaryDark : colors.primaryDark,
        200: mode === ThemeMode.DARK ? colors.darkPrimary200 : colors.primary200,
        800: mode === ThemeMode.DARK ? colors.darkPrimary800 : colors.primary800
      },
      secondary: {
        light: mode === ThemeMode.DARK ? colors.darkSecondaryLight : colors.secondaryLight,
        main: mode === ThemeMode.DARK ? colors.darkSecondaryMain : colors.secondaryMain,
        dark: mode === ThemeMode.DARK ? colors.darkSecondaryDark : colors.secondaryDark,
        200: mode === ThemeMode.DARK ? colors.darkSecondary200 : colors.secondary200,
        800: mode === ThemeMode.DARK ? colors.darkSecondary800 : colors.secondary800
      },
      error: {
        light: colors.errorLight,
        main: colors.errorMain,
        dark: colors.errorDark
      },
      orange: {
        light: colors.orangeLight,
        main: colors.orangeMain,
        dark: colors.orangeDark
      },
      warning: {
        light: colors.warningLight,
        main: colors.warningMain,
        dark: colors.warningDark,
        contrastText: mode === ThemeMode.DARK ? colors.darkTextPrimary : colors.grey700
      },
      success: {
        light: colors.successLight,
        200: colors.success200,
        main: colors.successMain,
        dark: colors.successDark
      },
      grey: {
        50: colors.grey50,
        100: colors.grey100,
        500: mode === ThemeMode.DARK ? colors.darkTextSecondary : colors.grey500,
        600: mode === ThemeMode.DARK ? colors.darkTextTitle : colors.grey600,
        700: mode === ThemeMode.DARK ? colors.darkTextPrimary : colors.grey700,
        900: mode === ThemeMode.DARK ? colors.darkTextPrimary : colors.grey900
      },
      dark: {
        light: colors.darkTextPrimary,
        main: colors.darkLevel1,
        dark: colors.darkLevel2,
        800: colors.darkBackground,
        900: colors.darkPaper
      },
      text: {
        primary: mode === ThemeMode.DARK ? colors.darkTextPrimary : colors.grey700,
        secondary: mode === ThemeMode.DARK ? colors.darkTextSecondary : colors.grey500,
        dark: mode === ThemeMode.DARK ? colors.darkTextPrimary : colors.grey900,
        hint: colors.grey100
      },
      divider: mode === ThemeMode.DARK ? alpha(colors.grey200, 0.2) : colors.grey200,
      background: {
        paper: mode === ThemeMode.DARK ? colors.darkLevel2 : colors.paper,
        default: mode === ThemeMode.DARK ? colors.darkPaper : colors.paper
      }
    }
  });
}

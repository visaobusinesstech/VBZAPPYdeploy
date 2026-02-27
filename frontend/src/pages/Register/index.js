import React, { useEffect, useMemo, useState, useContext } from "react";
import { useHistory } from "react-router-dom";
import { Formik, Form, Field } from "formik";
import * as Yup from "yup";
import {
  Box,
  Typography,
  TextField,
  Grid,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  ListItemText,
  FormControlLabel,
  CircularProgress,
  Stepper,
  Step,
  StepLabel,
  makeStyles,
  IconButton
} from "@material-ui/core";
import { toast } from "react-toastify";
import usePlans from "../../hooks/usePlans";
import { openApi } from "../../services/api";
import { i18n } from "../../translate/i18n";
import ColorModeContext from "../../layout/themeContext";
import { useTheme, withStyles } from "@material-ui/core/styles";
import Brightness4Icon from "@material-ui/icons/Brightness4";
import Brightness7Icon from "@material-ui/icons/Brightness7";
import ArrowBackIosIcon from "@material-ui/icons/ArrowBackIos";
import ArrowForwardIosIcon from "@material-ui/icons/ArrowForwardIos";
import StepConnector from "@material-ui/core/StepConnector";
import BRFlag from "../../assets/brazil.png";
import USFlag from "../../assets/unitedstates.png";
import ESFlag from "../../assets/esspain.png";
import ARFlag from "../../assets/arabe.png";

const useStyles = makeStyles(theme => ({
  root: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: theme.palette.type === "light" ? "#f5f5f7" : theme.palette.background.default,
    padding: theme.spacing(5, 1.5, 2),
    fontFamily: "'Helvetica Neue', Arial, sans-serif",
    color: theme.palette.type === "light" ? "#111" : theme.palette.text.primary
  },
  container: {
    width: "100%",
    maxWidth: 640,
    position: "relative"
  },
  topBar: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    marginBottom: theme.spacing(2),
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    padding: theme.spacing(0.75, 1),
    zIndex: 20,
    background: "transparent"
  },
  stepperWrap: {
    flex: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: theme.spacing(0, 1),
    marginTop: theme.spacing(3)
  },
  stepperInner: {
    width: "100%",
    maxWidth: 520
  },
  brand: {
    display: "flex",
    alignItems: "flex-start",
    gap: theme.spacing(1.5),
    paddingTop: 0
  },
  logo: {
    height: 72,
    width: "auto"
  },
  stepperClear: {
    background: "transparent !important",
    boxShadow: "none !important",
    padding: theme.spacing(0.5, 0),
    "& .MuiSvgIcon-root": {
      fontSize: "1.2rem"
    },
    "& .MuiStepLabel-label": {
      fontSize: 12,
      fontFamily: "'Helvetica Neue', Arial, sans-serif",
      color: theme.palette.type === "light" ? "#111" : theme.palette.text.primary
    },
    "& .MuiStepIcon-root": {
      color: "#cbd5e1"
    },
    "& .MuiStepIcon-root.MuiStepIcon-active": {
      color: theme.palette.primary.main
    },
    "& .MuiStepIcon-root.MuiStepIcon-completed": {
      color: theme.palette.primary.dark
    },
    "& .MuiStepLabel-label.MuiStepLabel-active": {
      color: theme.palette.primary.main
    }
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: theme.spacing(2)
  },
  title: {
    fontWeight: 700,
    fontSize: 22
  },
  subtitle: {
    color: theme.palette.text.secondary
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 600,
    marginBottom: theme.spacing(2)
  },
  grayDivider: {
    backgroundColor: theme.palette.type === "light" ? "#e5e7eb" : theme.palette.divider,
    margin: theme.spacing(2, 0)
  },
  inputGroup: {
    border: "none",
    borderRadius: 16,
    padding: theme.spacing(1),
    background: "transparent",
    boxShadow: "none",
    "& .MuiOutlinedInput-root": {
      background: theme.palette.type === "light" ? "#ffffff" : theme.palette.background.paper,
      borderRadius: 12
    },
    "& .MuiFormLabel-root": {
      color: theme.palette.type === "light" ? "#111" : theme.palette.text.primary,
      fontFamily: "'Helvetica Neue', Arial, sans-serif",
      fontWeight: 300
    },
    "& .MuiInputBase-input": {
      color: theme.palette.type === "light" ? "#111" : theme.palette.text.primary,
      fontFamily: "'Helvetica Neue', Arial, sans-serif",
      fontWeight: 300
    }
  },
  actionBar: {
    display: "flex",
    justifyContent: "space-between",
    marginTop: theme.spacing(1)
  }
}));

const Connector = withStyles((theme) => ({
  alternativeLabel: {
    top: 14
  },
  active: {
    "& $line": {
      backgroundColor: theme.palette.primary.main
    }
  },
  completed: {
    "& $line": {
      backgroundColor: theme.palette.primary.main
    }
  },
  line: {
    height: 2,
    border: 0,
    backgroundColor: "#e5e7eb",
    borderRadius: 1
  }
}))(StepConnector);

const steps = [
  "Encontro e necessidades",
  "Informações da empresa",
  "Endereço",
  "Nome de contato",
  "Planos",
  "Confirmação"
];

const niches = [
  "Varejo",
  "Serviços",
  "Educação",
  "Saúde",
  "Imobiliário",
  "Tecnologia",
  "Outro"
];

const foundOptions = [
  "Google",
  "Indicação",
  "Redes sociais",
  "Marketplace/Parceria",
  "Outro"
];

const needsOptions = [
  "Atendimento com WhatsApp",
  "Chatbot/Fluxos",
  "Campanhas",
  "Relatórios/NPS",
  "Integrações",
  "Outro"
];

const Schema = Yup.object().shape({
  hasCNPJ: Yup.boolean(),
  document: Yup.string().when("hasCNPJ", {
    is: true,
    then: Yup.string().required(),
    otherwise: Yup.string().notRequired(),
  }),
  cpf: Yup.string().when("hasCNPJ", {
    is: false,
    then: Yup.string().required(),
    otherwise: Yup.string().notRequired(),
  }),
  personName: Yup.string().when("hasCNPJ", {
    is: false,
    then: Yup.string().required(),
    otherwise: Yup.string().notRequired(),
  }),
  companyName: Yup.string().when("hasCNPJ", {
    is: true,
    then: Yup.string().required(),
    otherwise: Yup.string().notRequired(),
  }),
  razaoSocial: Yup.string().when("hasCNPJ", {
    is: true,
    then: Yup.string().required(),
    otherwise: Yup.string().notRequired(),
  }),
  email: Yup.string().email().required(),
  password: Yup.string().min(5).required(),
  phone: Yup.string().required(),
  planId: Yup.string().required(),
  acceptTerms: Yup.boolean().oneOf([true]).required()
});

const Register = () => {
  const classes = useStyles();
  const history = useHistory();
  const theme = useTheme();
  const { colorMode } = useContext(ColorModeContext);
  const { getPlanList } = usePlans();
  const [plans, setPlans] = useState([]);
  const [activeStep, setActiveStep] = useState(0);
  const [loadingPlans, setLoadingPlans] = useState(false);
  const [validatingCep, setValidatingCep] = useState(false);

  useEffect(() => {
    const fetchPlans = async () => {
      setLoadingPlans(true);
      try {
        const list = await getPlanList({ listPublic: "false" });
        setPlans(list);
      } finally {
        setLoadingPlans(false);
      }
    };
    fetchPlans();
  }, []);

  const initialValues = useMemo(
    () => ({
      foundUs: [],
      needs: [],
      razaoSocial: "",
      companyName: "",
      document: "",
      hasCNPJ: true,
      cpf: "",
      personName: "",
      inscricaoEstadual: "",
      inscricaoMunicipal: "",
      niche: "",
      cep: "",
      logradouro: "",
      numero: "",
      complemento: "",
      bairro: "",
      cidade: "",
      uf: "",
      legalName: "",
      legalEmail: "",
      legalPhone: "",
      techName: "",
      techEmail: "",
      techPhone: "",
      publicAccountName: "",
      email: "",
      password: "",
      phone: "",
      planId: "",
      acceptTerms: false
    }),
    []
  );

  const handleCep = async (cep, setFieldValue) => {
    const digits = (cep || "").replace(/\D/g, "");
    if (digits.length !== 8) return;
    setValidatingCep(true);
    try {
      const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
      const data = await res.json();
      if (!data.erro) {
        setFieldValue("logradouro", data.logradouro || "");
        setFieldValue("bairro", data.bairro || "");
        setFieldValue("cidade", data.localidade || "");
        setFieldValue("uf", data.uf || "");
      }
    } catch {}
    setValidatingCep(false);
  };

  const next = () => setActiveStep(prev => Math.min(prev + 1, steps.length - 1));
  const prev = () => setActiveStep(prev => Math.max(prev - 1, 0));

  const onSubmit = async values => {
    const payload = {
      companyName: values.companyName,
      document: (values.hasCNPJ ? values.document : values.cpf).replace(/\D/g, ""),
      email: values.email,
      phone: values.phone || values.legalPhone,
      planId: values.planId,
      metadata: {
        razaoSocial: values.razaoSocial,
        hasCNPJ: values.hasCNPJ,
        personName: values.hasCNPJ ? undefined : values.personName,
        niche: values.niche,
        foundUs: values.foundUs,
        needs: values.needs,
        address: {
          cep: values.cep,
          logradouro: values.logradouro,
          numero: values.numero,
          complemento: values.complemento,
          bairro: values.bairro,
          cidade: values.cidade,
          uf: values.uf
        },
        contacts: {
          legal: { name: values.legalName, email: values.legalEmail, phone: values.legalPhone },
          tech: { name: values.techName, email: values.techEmail, phone: values.techPhone }
        },
        publicAccountName: values.publicAccountName,
        acceptTerms: values.acceptTerms,
        acceptTimestamp: new Date().toISOString()
      }
    };
    try {
      await openApi.post("/auth/signup", payload);
      toast.success("Cadastro concluído");
      history.push("/login");
    } catch (e) {
      toast.error("Erro ao concluir cadastro");
    }
  };

  const Section1 = ({ values, setFieldValue }) => (
    <Box>
      <Grid container spacing={1} className={classes.inputGroup}>
        <Grid item xs={12}>
          <InputLabel>Como nos encontrou</InputLabel>
          <Select
            multiple
            value={values.foundUs}
            onChange={e => setFieldValue("foundUs", e.target.value)}
            fullWidth
            variant="outlined"
            displayEmpty
            renderValue={(selected) => {
              if (!selected || selected.length === 0) {
                return <span style={{ color: "#9ca3af" }}>Selecione</span>;
              }
              return selected.join(", ");
            }}
          >
            {foundOptions.map(opt => (
              <MenuItem key={opt} value={opt}>
                <Checkbox checked={values.foundUs.indexOf(opt) > -1} />
                <ListItemText primary={opt} />
              </MenuItem>
            ))}
          </Select>
        </Grid>
        <Grid item xs={12}>
          <InputLabel>Necessidade</InputLabel>
          <Select
            multiple
            value={values.needs}
            onChange={e => setFieldValue("needs", e.target.value)}
            fullWidth
            variant="outlined"
            displayEmpty
            renderValue={(selected) => {
              if (!selected || selected.length === 0) {
                return <span style={{ color: "#9ca3af" }}>Selecione</span>;
              }
              return selected.join(", ");
            }}
          >
            {needsOptions.map(opt => (
              <MenuItem key={opt} value={opt}>
                <Checkbox checked={values.needs.indexOf(opt) > -1} />
                <ListItemText primary={opt} />
              </MenuItem>
            ))}
          </Select>
        </Grid>
      </Grid>
    </Box>
  );

  const Section2 = ({ setFieldValue }) => (
    <Box>
      <Grid container spacing={1} className={classes.inputGroup}>
        <Grid item xs={12}>
          <FormControlLabel
            control={
              <Field as={Checkbox} name="hasCNPJ" color="primary" />
            }
            label="Tenho CNPJ"
          />
        </Grid>
        <Field name="hasCNPJ">
          {({ field, form }) =>
            field.value ? (
              <>
                <Grid item xs={12}>
                  <Field as={TextField} name="razaoSocial" label="Razão social" variant="outlined" fullWidth />
                </Grid>
                <Grid item xs={12}>
                  <Field as={TextField} name="companyName" label="Nome fantasia" variant="outlined" fullWidth />
                </Grid>
                <Grid item xs={12}>
                  <Field as={TextField} name="document" label="CNPJ" variant="outlined" fullWidth />
                </Grid>
              </>
            ) : (
              <>
                <Grid item xs={12}>
                  <Field as={TextField} name="cpf" label="CPF" variant="outlined" fullWidth />
                </Grid>
                <Grid item xs={12}>
                  <Field as={TextField} name="personName" label="Nome completo" variant="outlined" fullWidth />
                </Grid>
              </>
            )
          }
        </Field>
        <Grid item xs={12}>
          <Field as={TextField} name="niche" label="Nicho" variant="outlined" fullWidth select>
            {niches.map(n => (
              <MenuItem key={n} value={n}>{n}</MenuItem>
            ))}
          </Field>
        </Grid>
      </Grid>
    </Box>
  );

  const SectionAddress = ({ setFieldValue }) => (
    <Box>
      <Grid container spacing={1} className={classes.inputGroup}>
        <Grid item xs={12}>
          <Field
            as={TextField}
            name="cep"
            label="CEP"
            variant="outlined"
            fullWidth
            placeholder="00000-000"
            onBlur={e => handleCep(e.target.value, setFieldValue)}
            InputProps={{
              endAdornment: validatingCep ? <CircularProgress size={16} /> : null
            }}
          />
        </Grid>
        <Grid item xs={12}>
          <Field as={TextField} name="logradouro" label="Logradouro" variant="outlined" fullWidth />
        </Grid>
        <Grid item xs={12}>
          <Field as={TextField} name="numero" label="Número" variant="outlined" fullWidth />
        </Grid>
        <Grid item xs={12}>
          <Field as={TextField} name="complemento" label="Complemento" variant="outlined" fullWidth />
        </Grid>
        <Grid item xs={12}>
          <Field as={TextField} name="bairro" label="Bairro" variant="outlined" fullWidth />
        </Grid>
        <Grid item xs={12}>
          <Field as={TextField} name="cidade" label="Cidade" variant="outlined" fullWidth />
        </Grid>
        <Grid item xs={12}>
          <Field as={TextField} name="uf" label="UF" variant="outlined" fullWidth />
        </Grid>
      </Grid>
    </Box>
  );

  const Section3 = ({ touched, errors, values, setFieldValue }) => (
    <Box>
      <Grid container spacing={1} className={classes.inputGroup}>
        <Grid item xs={12}>
          <Field as={TextField} name="legalName" label="Nome completo" variant="outlined" fullWidth />
        </Grid>
        <Grid item xs={12}>
          <Field as={TextField} name="legalEmail" label="E-mail" variant="outlined" fullWidth />
        </Grid>
        <Grid item xs={12}>
          <Field as={TextField} name="legalPhone" label="Telefone" variant="outlined" fullWidth />
        </Grid>
        <Grid item xs={12}>
          <Field as={TextField} name="publicAccountName" label="Nome público da empresa" variant="outlined" fullWidth />
        </Grid>
      </Grid>
    </Box>
  );

  const Section4 = ({ values, touched, errors }) => (
    <Box>
      <Grid container spacing={1} className={classes.inputGroup}>
        <Grid item xs={12}>
          <InputLabel>Plano</InputLabel>
          <Field as={Select} name="planId" fullWidth variant="outlined" error={touched.planId && Boolean(errors.planId)}>
            {plans.map(p => (
              <MenuItem key={p.id} value={p.id}>
                {p.name} • Atendentes {p.users} • WhatsApp {p.connections} • Filas {p.queues} • R$ {p.amount}
              </MenuItem>
            ))}
          </Field>
        </Grid>
      </Grid>
    </Box>
  );

  const Section5 = ({ touched, errors }) => (
    <Box>
      <Grid container spacing={1} className={classes.inputGroup}>
        <Grid item xs={12} sm={6}>
          <Field as={TextField} name="email" label="E-mail de acesso" variant="outlined" fullWidth error={touched.email && Boolean(errors.email)} helperText={touched.email && errors.email} />
        </Grid>
        <Grid item xs={12} sm={6}>
          <Field as={TextField} name="password" label="Senha" type="password" variant="outlined" fullWidth error={touched.password && Boolean(errors.password)} helperText={touched.password && errors.password} />
        </Grid>
        <Grid item xs={12} sm={6}>
          <Field as={TextField} name="phone" label="Telefone (WhatsApp)" variant="outlined" fullWidth />
        </Grid>
        <Grid item xs={12}>
          <FormControlLabel
            control={
              <Field as={Checkbox} name="acceptTerms" color="primary" />
            }
            label="Li e aceito os Termos e a Política de Privacidade"
          />
          {touched.acceptTerms && errors.acceptTerms && (
            <Typography color="error" variant="caption">{errors.acceptTerms}</Typography>
          )}
        </Grid>
      </Grid>
    </Box>
  );

  const canGoNext = (step, values) => {
    switch (step) {
      case 0:
        return (values.foundUs && values.foundUs.length > 0) || (values.needs && values.needs.length > 0);
      case 1:
        return values.hasCNPJ
          ? (values.razaoSocial && values.companyName && values.document)
          : (values.cpf && values.personName);
      case 2:
        return values.cep && values.logradouro && values.cidade && values.uf;
      case 3:
        return values.legalName && values.legalEmail && values.legalPhone && values.publicAccountName;
      case 4:
        return !!values.planId;
      case 5:
        return values.email && values.password && values.acceptTerms;
      default:
        return false;
    }
  };

  return (
    <Box className={classes.root}>
      <div className={classes.container}>
        <Box className={classes.topBar}>
          <div className={classes.brand}>
            <img
              className={classes.logo}
              alt="VB Solution"
              src={theme.mode === "light" ? theme.calculatedLogoLight() : theme.calculatedLogoDark()}
            />
          </div>
          <div className={classes.stepperWrap}>
            <div className={classes.stepperInner}>
              <Stepper activeStep={activeStep} alternativeLabel className={classes.stepperClear} connector={<Connector />}>
                {steps.map(label => (
                  <Step key={label}>
                    <StepLabel>{label}</StepLabel>
                  </Step>
                ))}
              </Stepper>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Select
              value={i18n.language || "pt-BR"}
              onChange={e => i18n.changeLanguage(e.target.value)}
              variant="outlined"
              style={{ height: 36, borderRadius: 10 }}
            >
              <MenuItem value="pt-BR"><img alt="pt" src={BRFlag} height={14} style={{ marginRight: 8 }} />PT</MenuItem>
              <MenuItem value="en"><img alt="en" src={USFlag} height={14} style={{ marginRight: 8 }} />EN</MenuItem>
              <MenuItem value="es"><img alt="es" src={ESFlag} height={14} style={{ marginRight: 8 }} />ES</MenuItem>
              <MenuItem value="ar"><img alt="ar" src={ARFlag} height={14} style={{ marginRight: 8 }} />AR</MenuItem>
            </Select>
            <IconButton onClick={() => colorMode?.toggleColorMode?.()}>
              {theme.mode === "light" ? <Brightness4Icon /> : <Brightness7Icon />}
            </IconButton>
          </div>
        </Box>
        <Box mt={4}>
          <Formik
            initialValues={initialValues}
            validationSchema={Schema}
            onSubmit={onSubmit}
          >
            {({ values, touched, errors, isSubmitting, setFieldValue }) => (
              <Form>
                {activeStep === 0 && <Section1 values={values} setFieldValue={setFieldValue} />}
                {activeStep === 1 && <Section2 setFieldValue={setFieldValue} />}
                {activeStep === 2 && <SectionAddress setFieldValue={setFieldValue} />}
                {activeStep === 3 && <Section3 touched={touched} errors={errors} values={values} setFieldValue={setFieldValue} />}
                {activeStep === 4 && <Section4 values={values} touched={touched} errors={errors} />}
                {activeStep === 5 && <Section5 touched={touched} errors={errors} />}

                <IconButton
                  onClick={prev}
                  disabled={activeStep === 0}
                  style={{
                    position: "fixed",
                    top: "50%",
                    transform: "translateY(-50%)",
                    left: 12,
                    zIndex: 40,
                    background: activeStep === 0 ? "#cbd5e1" : theme.palette.primary.main,
                    color: "#fff",
                    width: 46,
                    height: 46,
                    borderRadius: "50%",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.15)"
                  }}
                >
                  <ArrowBackIosIcon />
                </IconButton>
                {activeStep < steps.length - 1 ? (
                  <IconButton
                    onClick={() => canGoNext(activeStep, values) && next()}
                    disabled={!canGoNext(activeStep, values)}
                    style={{
                      position: "fixed",
                      top: "50%",
                      transform: "translateY(-50%)",
                      right: 12,
                      zIndex: 40,
                      background: canGoNext(activeStep, values) ? theme.palette.primary.main : "#cbd5e1",
                      color: "#fff",
                      width: 46,
                      height: 46,
                      borderRadius: "50%",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.15)"
                    }}
                  >
                    <ArrowForwardIosIcon />
                  </IconButton>
                ) : (
                  <IconButton
                    type="submit"
                    disabled={!canGoNext(activeStep, values) || isSubmitting}
                    style={{
                      position: "fixed",
                      top: "50%",
                      transform: "translateY(-50%)",
                      right: 12,
                      zIndex: 40,
                      background: canGoNext(activeStep, values) ? theme.palette.primary.main : "#cbd5e1",
                      color: "#fff",
                      width: 46,
                      height: 46,
                      borderRadius: "50%",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.15)"
                    }}
                  >
                    <ArrowForwardIosIcon />
                  </IconButton>
                )}
              </Form>
            )}
          </Formik>
        </Box>
      </div>
    </Box>
  );
};

export default Register;

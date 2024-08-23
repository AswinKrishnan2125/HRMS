

import React, { useState, useEffect } from "react";
import {
  Box,
  Button,
  Checkbox,
  IconButton,
  Modal,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  ThemeProvider,
  Typography,
  createTheme,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import VisibilityIcon from "@mui/icons-material/Visibility";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import { useMediaQuery } from "@mui/material";
import { db } from "../fireBaseConfig";
import { collection, addDoc, getDocs, doc, deleteDoc, updateDoc } from "firebase/firestore";
import * as XLSX from "xlsx";
import Dashboard from "./Dashboard";


// Define your theme here
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
  typography: {
    fontFamily: 'Roboto, Arial, sans-serif',
  },
});

const Payroll = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selected, setSelected] = useState([]);
  const [filteredRows, setFilteredRows] = useState([]);
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    employeeName: "",
    salary: "",
    deductions: "",
    netPay: "",
    payPeriodStart: "",
    payPeriodEnd: "",
    status: "",
  });
  const [isEdit, setIsEdit] = useState(false);
  const [currentId, setCurrentId] = useState(null);

  const isMobile = useMediaQuery("(max-width:600px)");

  // Fetch payroll data from Firestore on component mount
  useEffect(() => {
    const fetchPayrolls = async () => {
      const payrollsCollection = collection(db, "Payrolls");
      const payrollSnapshot = await getDocs(payrollsCollection);
      const payrollList = payrollSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      setFilteredRows(payrollList);
    };
    fetchPayrolls();
  }, []);

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const handleSave = async () => {
    if (isEdit && currentId) {
      // Update existing payroll
      const payrollDoc = doc(db, "Payrolls", currentId);
      await updateDoc(payrollDoc, formData);
    } else {
      // Add new payroll
      await addDoc(collection(db, "Payrolls"), formData);
    }
    handleClose();
    setFormData({
      employeeName: "",
      salary: "",
      deductions: "",
      netPay: "",
      payPeriodStart: "",
      payPeriodEnd: "",
      status: "",
    });
    setIsEdit(false);
    setCurrentId(null);
    // Refresh the data
    const payrollsCollection = collection(db, "Payrolls");
    const payrollSnapshot = await getDocs(payrollsCollection);
    const payrollList = payrollSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));
    setFilteredRows(payrollList);
  };

  const handleDelete = async (selectedIds) => {
    for (const id of selectedIds) {
      const payrollDoc = doc(db, "Payrolls", id);
      await deleteDoc(payrollDoc);
    }
    setSelected([]);
    // Refresh the data
    const payrollsCollection = collection(db, "Payrolls");
    const payrollSnapshot = await getDocs(payrollsCollection);
    const payrollList = payrollSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));
    setFilteredRows(payrollList);
  };

  const handleEdit = (row) => {
    setFormData(row);
    setIsEdit(true);
    setCurrentId(row.id);
    handleOpen();
  };

  const handleCheckboxClick = (id) => {
    const selectedIndex = selected.indexOf(id);
    let newSelected = [];

    if (selectedIndex === -1) {
      newSelected = newSelected.concat(selected, id);
    } else if (selectedIndex === 0) {
      newSelected = newSelected.concat(selected.slice(1));
    } else if (selectedIndex === selected.length - 1) {
      newSelected = newSelected.concat(selected.slice(0, -1));
    } else if (selectedIndex > 0) {
      newSelected = newSelected.concat(selected.slice(0, selectedIndex), selected.slice(selectedIndex + 1));
    }

    setSelected(newSelected);
  };

  const handleSelectAllClick = (event) => {
    if (event.target.checked) {
      const newSelected = filteredRows.map((row) => row.id);
      setSelected(newSelected);
      return;
    }
    setSelected([]);
  };

  const downloadExcel = () => {
    const ws = XLSX.utils.json_to_sheet(filteredRows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Payrolls");
    XLSX.writeFile(wb, "Payrolls_Report.xlsx");
  };

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ display: "flex", bgcolor: "background.default", minHeight: "100vh" }}>
        <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
          <Dashboard/>
          <section style={{ paddingLeft: "240px", paddingRight: "0px", paddingTop: "40px" }}>
            <Box sx={{ display: "flex", alignItems: "center", mb: 2, justifyContent: "space-between" }}>
              <Box sx={{ display: "flex", alignItems: "center", flexGrow: 1 }}>
                <TextField
                  label="Search Payrolls"
                  variant="outlined"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  sx={{ flexGrow: 1, maxWidth: isMobile ? "calc(100% - 48px)" : 300, bgcolor: "white" }}
                  placeholder="Employee name, salary, date"
                  InputProps={{
                    endAdornment: (
                      <IconButton edge="end" color="primary">
                        <SearchIcon />
                      </IconButton>
                    ),
                  }}
                />
                <IconButton
                  color="primary"
                  onClick={handleOpen}
                  sx={{ ml: 2, border: 1, borderRadius: 1 }}
                >
                  <AddIcon />
                </IconButton>
                {selected.length > 0 && (
                  <IconButton
                    color="secondary"
                    onClick={() => handleDelete(selected)}
                    sx={{ ml: 2 }}
                  >
                    <DeleteIcon />
                  </IconButton>
                )}
              </Box>
              <Button
                variant="contained"
                color="primary"
                startIcon={<FileDownloadIcon />}
                onClick={downloadExcel}
              >
                Download Report
              </Button>
            </Box>
            <Typography variant="h4" component="h2" gutterBottom>
              Payroll List
            </Typography>
            <TableContainer component={Paper} sx={{ boxShadow: 3 }}>
              <Table sx={{ minWidth: { xs: 300, sm: 650 } }} aria-label="payroll table">
                <TableHead>
                  <TableRow sx={{ bgcolor: "primary.main" }}>
                    <TableCell padding="checkbox">
                      <Checkbox
                        color="primary"
                        indeterminate={selected.length > 0 && selected.length < filteredRows.length}
                        checked={filteredRows.length > 0 && selected.length === filteredRows.length}
                        onChange={handleSelectAllClick}
                        inputProps={{
                          "aria-label": "select all payrolls",
                        }}
                      />
                    </TableCell>
                    <TableCell sx={{ color: "white" }}>Employee Name</TableCell>
                    <TableCell sx={{ color: "white" }}>Salary</TableCell>
                    <TableCell sx={{ color: "white" }}>Deductions</TableCell>
                    <TableCell sx={{ color: "white" }}>Net Pay</TableCell>
                    <TableCell sx={{ color: "white" }}>Pay Period</TableCell>
                    <TableCell sx={{ color: "white" }}>Status</TableCell>
                    <TableCell sx={{ color: "white" }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredRows.map((row) => (
                    <TableRow
                      key={row.id}
                      hover
                      role="checkbox"
                      aria-checked={selected.indexOf(row.id) !== -1}
                      selected={selected.indexOf(row.id) !== -1}
                    >
                      <TableCell padding="checkbox">
                        <Checkbox
                          color="primary"
                          checked={selected.indexOf(row.id) !== -1}
                          onChange={() => handleCheckboxClick(row.id)}
                        />
                      </TableCell>
                      <TableCell>{row.employeeName}</TableCell>
                      <TableCell>{row.salary}</TableCell>
                      <TableCell>{row.deductions}</TableCell>
                      <TableCell>{row.netPay}</TableCell>
                      <TableCell>{`${new Date(row.payPeriodStart).toLocaleDateString()} - ${new Date(row.payPeriodEnd).toLocaleDateString()}`}</TableCell>
                      <TableCell>{row.status}</TableCell>
                      <TableCell>
                        <IconButton
                          color="primary"
                          onClick={() => handleView(row)}
                          sx={{ ml: 1 }}
                        >
                          <VisibilityIcon />
                        </IconButton>
                        <IconButton
                          color="secondary"
                          onClick={() => handleEdit(row)}
                          sx={{ ml: 1 }}
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          color="error"
                          onClick={() => handleDelete([row.id])}
                          sx={{ ml: 1 }}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </section>

          {/* Modal for adding/editing payroll */}
          <Modal open={open} onClose={handleClose}>
            <Box sx={{ ...modalStyle, bgcolor: "background.paper" }}>
              <Typography variant="h6" component="h2">
                {isEdit ? "Edit Payroll" : "Add Payroll"}
              </Typography>
              <TextField
                label="Employee Name"
                fullWidth
                margin="normal"
                value={formData.employeeName}
                onChange={(e) => setFormData({ ...formData, employeeName: e.target.value })}
              />
              <TextField
                label="Salary"
                fullWidth
                margin="normal"
                value={formData.salary}
                onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
              />
              <TextField
                label="Deductions"
                fullWidth
                margin="normal"
                value={formData.deductions}
                onChange={(e) => setFormData({ ...formData, deductions: e.target.value })}
              />
              <TextField
                label="Net Pay"
                fullWidth
                margin="normal"
                value={formData.netPay}
                onChange={(e) => setFormData({ ...formData, netPay: e.target.value })}
              />
              <TextField
                label="Pay Period Start"
                type="date"
                fullWidth
                margin="normal"
                InputLabelProps={{ shrink: true }}
                value={formData.payPeriodStart}
                onChange={(e) => setFormData({ ...formData, payPeriodStart: e.target.value })}
              />
              <TextField
                label="Pay Period End"
                type="date"
                fullWidth
                margin="normal"
                InputLabelProps={{ shrink: true }}
                value={formData.payPeriodEnd}
                onChange={(e) => setFormData({ ...formData, payPeriodEnd: e.target.value })}
              />
              <TextField
                label="Status"
                fullWidth
                margin="normal"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              />
              <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 2 }}>
                <Button onClick={handleClose} sx={{ mr: 2 }}>
                  Cancel
                </Button>
                <Button variant="contained" color="primary" onClick={handleSave}>
                  Save
                </Button>
              </Box>
            </Box>
          </Modal>
        </Box>
      </Box>
    </ThemeProvider>
  );
};

const modalStyle = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: { xs: "90%", sm: "500px" },
  bgcolor: "background.paper",
  border: "2px solid #000",
  boxShadow: 24,
  p: 4,
};

export default Payroll;

import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import './EmployeeForm.css';

const EmployeeForm = () => {
  const [employees, setEmployees] = useState([]);
  const [formData, setFormData] = useState({
    full_name: 'test',
    phone_number: 'test',
    job_title: 'test',
    gender: 'Male',
    address: 'test',
    working_status: false,
  });
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [employeesPerPage] = useState(5);
  const [totalEmployees, setTotalEmployees] = useState(0);

  useEffect(() => {
    fetchEmployees();
    countEmployees();
  }, [currentPage]); // Reload when currentPage changes

  const fetchEmployees = async () => {
    const { data, error } = await supabase
      .from('employees')
      .select()
      .range((currentPage - 1) * employeesPerPage, currentPage * employeesPerPage - 1)
      .order('created_at', { ascending: false }); // Order by created_at descending;
    if (error) {
      console.error(error);
    } else {
      setEmployees(data);
    }
  };

  const countEmployees = async () => {
    const { count, error } = await supabase.from('employees').select('id', { count: 'exact' });
    if (error) {
      console.error(error);
    } else {
      setTotalEmployees(count);
    }
  };


  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isEditing) {
      // Perform update operation
      const { data, error } = await supabase
        .from('employees')
        .update(formData)
        .eq('id', editId);
      if (error) {
        console.error(error);
      } else {
        setEmployees(employees.map((emp) => (emp.id === editId ? data[0] : emp)));
        setIsEditing(false);
        setEditId(null);
      }
    } else {
      // Perform insert operation
      const { data, error } = await supabase.from('employees').insert([formData]).select("*").single();
      if (error) {
        console.error(error);
      } else {
        //setEmployees([...employees, data]);

         // Fetch updated list after insertion
        const updatedEmployees = await supabase
        .from('employees')
        .select()
        .order('created_at', { ascending: false }) // Order by created_at descending
        .range(0, employeesPerPage - 1); // Fetch only the first page (5 items)

        if (updatedEmployees.error) {
            console.error(updatedEmployees.error);
        } else {
            setEmployees(updatedEmployees.data);
        }


      }
    }
    /*
    setFormData({
      full_name: '',
      phone_number: '',
      job_title: '',
      gender: '',
      address: '',
      working_status: false,
    });
    */
  };

  const handleDelete = async (id) => {
    const { error } = await supabase.from('employees').delete().eq('id', id);
    if (error) {
      console.error(error);
    } else {
      setEmployees(employees.filter((employee) => employee.id !== id));
    }
  };

  const handleEdit = async (id) => {
    const { data } = await supabase.from('employees').select().eq('id', id).single();
    setFormData(data);
    setIsEditing(true);
    setEditId(id);
  };

  const handleStatusChange = async (id, status) => {
    const { error } = await supabase.from('employees').update({ working_status: !status }).eq('id', id);
    if (error) {
      console.error(error);
    } else {
      fetchEmployees();
    }
  };

  const handleCloseEdit = () => {
    setFormData({
      full_name: '',
      phone_number: '',
      job_title: '',
      gender: '',
      address: '',
      working_status: false,
    });
    setIsEditing(false);
    setEditId(null);
  };

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  // Pagination calculations
  const totalPages = Math.ceil(totalEmployees / employeesPerPage);
  const pageNumbers = [];
  for (let i = 1; i <= totalPages; i++) {
    pageNumbers.push(i);
  }

  return (
    <div className="container">
      <div className="form-container">
        <h2>{isEditing ? 'Edit Employee' : 'Add Employee'}</h2>
        <form onSubmit={handleSubmit}>
          <table>
            <tbody>
              <tr>
                <td>Full Name:</td>
                <td><input type="text" name="full_name" value={formData.full_name} onChange={handleChange} placeholder="Full Name" required /></td>
              </tr>
              <tr>
                <td>Phone Number:</td>
                <td><input type="text" name="phone_number" value={formData.phone_number} onChange={handleChange} placeholder="Phone Number" required /></td>
              </tr>
              <tr>
                <td>Job Title:</td>
                <td><input type="text" name="job_title" value={formData.job_title} onChange={handleChange} placeholder="Job Title" required /></td>
              </tr>
              <tr>
                <td>Gender:</td>
                <td>
                  <select name="gender" value={formData.gender} onChange={handleChange} required>
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </td>
              </tr>
              <tr>
                <td>Address:</td>
                <td><input type="text" name="address" value={formData.address} onChange={handleChange} placeholder="Address" required /></td>
              </tr>
              <tr>
                <td>Working Status:</td>
                <td><input type="checkbox" name="working_status" checked={formData.working_status} onChange={(e) => setFormData({ ...formData, working_status: e.target.checked })} /></td>
              </tr>
              <tr>
                <td colSpan="2" className="button-row">
                  <button type="submit">{isEditing ? 'Update' : 'Add'}</button>
                  {isEditing && <button type="button" onClick={handleCloseEdit}>Close</button>}
                </td>
              </tr>
            </tbody>
          </table>
        </form>
      </div>

      <div className="employee-list">
        <h2>Employee List</h2>
        <table>
          <thead>
            <tr>
              <th>id</th>  
              <th>Full Name</th>
              <th>Phone Number</th>
              <th>Job Title</th>
              <th>Gender</th>
              <th>Address</th>
              <th>Working Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {employees.map((employee) => (
              <tr key={employee.id} className="employee-row">
                <td>{employee.id}</td>
                <td>{employee.full_name}</td>
                <td>{employee.phone_number}</td>
                <td>{employee.job_title}</td>
                <td>{employee.gender}</td>
                <td>{employee.address}</td>
                <td>{employee.working_status ? 'Working' : 'Not Working'}</td>
                <td>
                  <button onClick={() => handleEdit(employee.id)}>Edit</button>
                  <button onClick={() => handleDelete(employee.id)}>Delete</button>
                  <button onClick={() => handleStatusChange(employee.id, employee.working_status)}>Change Status</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="pagination">
          <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1}>Previous</button>
          {pageNumbers.map((number) => (
            <button key={number} onClick={() => handlePageChange(number)} className={currentPage === number ? 'active' : ''}>
              {number}
            </button>
          ))}
          <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages}>Next</button>
        </div>
      </div>
    </div>
  );
};

export default EmployeeForm;

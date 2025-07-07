import React, { useCallback, useEffect, useRef, useState } from 'react'
import Dashboard from '../pages/Dashboard'
import DashboardLayout from './DashboardLayout'
import { buttonStyles, containerStyles, iconStyles, statusStyles } from '../assets/dummystyle'
import { TitleInput } from './Inputs'
import { useNavigate, useParams } from 'react-router-dom'
import { AlertCircle, ArrowLeft, Download, Loader2, Palette, Save, Trash2 } from 'lucide-react'
import axiosInstance from '../utils/axiosInstance'
import { API_PATHS } from '../utils/apiPaths'
import toast from "react-hot-toast";
import { fixTailwindColors } from '../utils/color'
import html2pdf from 'html2pdf.js'
import StepProgress from './StepProgress';
import Modal from './Modal'
import RenderResume from './RenderResume'; // adjust the path as needed
import ThemeSelector from './ThemeSelector'; // 🔁 adjust path as necessary
import html2canvas from 'html2canvas';
import { dataURLtoFile } from '../utils/helper'



const useResizeObserver = () => {
    const [size, setSize] = useState({width: 0, height: 0});
    const ref = useCallback((node) => {
        if (node) {
            const resizeObserver = new ResizeObserver((entries) => {
                const {width, height} = entries[0].contentRect;
                setSize({width, height});
            })

            resizeObserver.observe(node)
        }
    }, [])
    return {...size, ref }
}

const EditResume = () => {

     const { resumeId } = useParams()
  const navigate = useNavigate()
  const resumeDownloadRef = useRef(null)
  const thumbnailRef = useRef(null)

  const [openThemeSelector, setOpenThemeSelector] = useState(false)
  const [openPreviewModal, setOpenPreviewModal] = useState(false)
  const [currentPage, setCurrentPage] = useState("profile-info")
  const [progress, setProgress] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  const [downloadSuccess, setDownloadSuccess] = useState(false)
  const [errorMsg, setErrorMsg] = useState("")
  const [completionPercentage, setCompletionPercentage] = useState(0)

  const { width: previewWidth, ref: previewContainerRef } = useResizeObserver();

  const [resumeData, setResumeData] = useState({
    title: "Professional Resume",
    thumbnailLink: "",
    profileInfo: {
      fullName: "",
      designation: "",
      summary: "",
    },
    template: {
      theme: "modern",
      colorPalette: []
    },
    contactInfo: {
      email: "",
      phone: "",
      location: "",
      linkedin: "",
      github: "",
      website: "",
    },
    workExperience: [
      {
        company: "",
        role: "",
        startDate: "",
        endDate: "",
        description: "",
      },
    ],
    education: [
      {
        degree: "",
        institution: "",
        startDate: "",
        endDate: "",
      },
    ],
    skills: [
      {
        name: "",
        progress: 0,
      },
    ],
    projects: [
      {
        title: "",
        description: "",
        github: "",
        liveDemo: "",
      },
    ],
    certifications: [
      {
        title: "",
        issuer: "",
        year: "",
      },
    ],
    languages: [
      {
        name: "",
        progress: 0,
      },
    ],
    interests: [""],
  })

  // Calculate completion percentage
  const calculateCompletion = () => {
    let completedFields = 0;
    let totalFields = 0;

    // Profile Info
    totalFields += 3;
    if (resumeData.profileInfo.fullName) completedFields++;
    if (resumeData.profileInfo.designation) completedFields++;
    if (resumeData.profileInfo.summary) completedFields++;

    // Contact Info
    totalFields += 2;
    if (resumeData.contactInfo.email) completedFields++;
    if (resumeData.contactInfo.phone) completedFields++;

    // Work Experience
    resumeData.workExperience.forEach(exp => {
      totalFields += 5;
      if (exp.company) completedFields++;
      if (exp.role) completedFields++;
      if (exp.startDate) completedFields++;
      if (exp.endDate) completedFields++;
      if (exp.description) completedFields++;
    });

    // Education
    resumeData.education.forEach(edu => {
      totalFields += 4;
      if (edu.degree) completedFields++;
      if (edu.institution) completedFields++;
      if (edu.startDate) completedFields++;
      if (edu.endDate) completedFields++;
    });

    // Skills
    resumeData.skills.forEach(skill => {
      totalFields += 2;
      if (skill.name) completedFields++;
      if (skill.progress > 0) completedFields++;
    });

    // Projects
    resumeData.projects.forEach(project => {
      totalFields += 4;
      if (project.title) completedFields++;
      if (project.description) completedFields++;
      if (project.github) completedFields++;
      if (project.liveDemo) completedFields++;
    });

    // Certifications
    resumeData.certifications.forEach(cert => {
      totalFields += 3;
      if (cert.title) completedFields++;
      if (cert.issuer) completedFields++;
      if (cert.year) completedFields++;
    });

    // Languages
    resumeData.languages.forEach(lang => {
      totalFields += 2;
      if (lang.name) completedFields++;
      if (lang.progress > 0) completedFields++;
    });

    // Interests
    totalFields += resumeData.interests.length;
    completedFields += resumeData.interests.filter(i => i.trim() !== "").length;

    const percentage = Math.round((completedFields / totalFields) * 100);
    setCompletionPercentage(percentage);
    return percentage;
  };

  useEffect(() => {
    calculateCompletion();
  }, [resumeData]);

 const validateAndNext = (e) => {
    const errors = []

    switch (currentPage) {
      case "profile-info":
        const { fullName, designation, summary } = resumeData.profileInfo
        if (!fullName.trim()) errors.push("Full Name is required")
        if (!designation.trim()) errors.push("Designation is required")
        if (!summary.trim()) errors.push("Summary is required")
        break

      case "contact-info":
        const { email, phone } = resumeData.contactInfo
        if (!email.trim() || !/^\S+@\S+\.\S+$/.test(email)) errors.push("Valid email is required.")
        if (!phone.trim() || !/^\d{10}$/.test(phone)) errors.push("Valid 10-digit phone number is required")
        break

      case "work-experience":
        resumeData.workExperience.forEach(({ company, role, startDate, endDate }, index) => {
          if (!company || !company.trim()) errors.push(`Company is required in experience ${index + 1}`)
          if (!role || !role.trim()) errors.push(`Role is required in experience ${index + 1}`)
          if (!startDate || !endDate) errors.push(`Start and End dates are required in experience ${index + 1}`)
        })
        break

      case "education-info":
        resumeData.education.forEach(({ degree, institution, startDate, endDate }, index) => {
          if (!degree.trim()) errors.push(`Degree is required in education ${index + 1}`)
          if (!institution.trim()) errors.push(`Institution is required in education ${index + 1}`)
          if (!startDate || !endDate) errors.push(`Start and End dates are required in education ${index + 1}`)
        })
        break

      case "skills":
        resumeData.skills.forEach(({ name, progress }, index) => {
          if (!name.trim()) errors.push(`Skill name is required in skill ${index + 1}`)
          if (progress < 1 || progress > 100)
            errors.push(`Skill progress must be between 1 and 100 in skill ${index + 1}`)
        })
        break

      case "projects":
        resumeData.projects.forEach(({ title, description }, index) => {
          if (!title.trim()) errors.push(`Project Title is required in project ${index + 1}`)
          if (!description.trim()) errors.push(`Project description is required in project ${index + 1}`)
        })
        break

      case "certifications":
        resumeData.certifications.forEach(({ title, issuer }, index) => {
          if (!title.trim()) errors.push(`Certification Title is required in certification ${index + 1}`)
          if (!issuer.trim()) errors.push(`Issuer is required in certification ${index + 1}`)
        })
        break

      case "additionalInfo":
        if (resumeData.languages.length === 0 || !resumeData.languages[0].name?.trim()) {
          errors.push("At least one language is required")
        }
        if (resumeData.interests.length === 0 || !resumeData.interests[0]?.trim()) {
          errors.push("At least one interest is required")
        }
        break

      default:
        break
    }

    if (errors.length > 0) {
      setErrorMsg(errors.join(", "))
      return
    }

    setErrorMsg("")
    goToNextStep()
  }

  const goToNextStep = () => {
    const pages = [
      "profile-info",
      "contact-info",
      "work-experience",
      "education-info",
      "skills",
      "projects",
      "certifications",
      "additionalInfo",
    ]

    if (currentPage === "additionalInfo") setOpenPreviewModal(true)

    const currentIndex = pages.indexOf(currentPage)
    if (currentIndex !== -1 && currentIndex < pages.length - 1) {
      const nextIndex = currentIndex + 1
      setCurrentPage(pages[nextIndex])

      const percent = Math.round((nextIndex / (pages.length - 1)) * 100)
      setProgress(percent)
      window.scrollTo({ top: 0, behavior: "smooth" })
    }
  }

  const goBack = () => {
    const pages = [
      "profile-info",
      "contact-info",
      "work-experience",
      "education-info",
      "skills",
      "projects",
      "certifications",
      "additionalInfo",
    ]

    if (currentPage === "profile-info") navigate("/dashboard")

    const currentIndex = pages.indexOf(currentPage)
    if (currentIndex > 0) {
      const prevIndex = currentIndex - 1
      setCurrentPage(pages[prevIndex])

      const percent = Math.round((prevIndex / (pages.length - 1)) * 100)
      setProgress(percent)
      window.scrollTo({ top: 0, behavior: "smooth" })
    }
  }

  const renderForm = () => {
  switch (currentPage) {
    case "profile-info":
      return (
        <div className="space-y-6 p-4 sm:p-6">
          <h2 className="text-2xl font-semibold text-gray-800">Profile Information</h2>

          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-600">Full Name</label>
              <input
                type="text"
                placeholder="Your Full Name"
                value={resumeData.profileInfo.fullName}
                onChange={(e) =>
                  updateSection("profileInfo", "fullName", e.target.value)
                }
                className="mt-1 w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-600">Designation</label>
              <input
                type="text"
                placeholder="Your Designation"
                value={resumeData.profileInfo.designation}
                onChange={(e) =>
                  updateSection("profileInfo", "designation", e.target.value)
                }
                className="mt-1 w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-600">Summary</label>
              <textarea
                rows="4"
                placeholder="Write a short summary"
                value={resumeData.profileInfo.summary}
                onChange={(e) =>
                  updateSection("profileInfo", "summary", e.target.value)
                }
                className="mt-1 w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>

          <div className="flex justify-end">
            
          </div>
        </div>
      );

    case "contact-info":
      return (
        <div className="space-y-6 p-4 sm:p-6">
          <h2 className="text-2xl font-semibold text-gray-800">Contact Information</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-600">Address</label>
              <input
                type="text"
                placeholder="Short Address"
                value={resumeData.contactInfo.location}
                onChange={(e) =>
                  updateSection("contactInfo", "location", e.target.value)
                }
                className="mt-1 w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-600">Phone Number</label>
              <input
                type="text"
                placeholder="1234567890"
                value={resumeData.contactInfo.phone}
                onChange={(e) =>
                  updateSection("contactInfo", "phone", e.target.value)
                }
                className="mt-1 w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-600">Email</label>
              <input
                type="email"
                placeholder="example@gmail.com"
                value={resumeData.contactInfo.email}
                onChange={(e) =>
                  updateSection("contactInfo", "email", e.target.value)
                }
                className="mt-1 w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-600">LinkedIn</label>
              <input
                type="text"
                placeholder="https://linkedin.com/in/username"
                value={resumeData.contactInfo.linkedin}
                onChange={(e) =>
                  updateSection("contactInfo", "linkedin", e.target.value)
                }
                className="mt-1 w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-600">GitHub</label>
              <input
                type="text"
                placeholder="https://github.com/username"
                value={resumeData.contactInfo.github}
                onChange={(e) =>
                  updateSection("contactInfo", "github", e.target.value)
                }
                className="mt-1 w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-600">Portfolio / Website</label>
              <input
                type="text"
                placeholder="https://yourwebsite.com"
                value={resumeData.contactInfo.website}
                onChange={(e) =>
                  updateSection("contactInfo", "website", e.target.value)
                }
                className="mt-1 w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>

          <div className="flex justify-end">
            
          </div>
        </div>
      );
          case "work-experience":
      return (
        <div className="space-y-6 p-4 sm:p-6">
          <h2 className="text-2xl font-semibold text-gray-800">Work Experience</h2>

          {resumeData.workExperience.map((exp, index) => (
            <div key={index} className="border p-4 rounded-md space-y-4 bg-gray-50">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Company</label>
                  <input
                    type="text"
                    placeholder="Company Name"
                    value={exp.company}
                    onChange={(e) =>
                      updateArrayItem("workExperience", index, "company", e.target.value)
                    }
                    className="mt-1 w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-600">Role</label>
                  <input
                    type="text"
                    placeholder="Job Title / Role"
                    value={exp.role}
                    onChange={(e) =>
                      updateArrayItem("workExperience", index, "role", e.target.value)
                    }
                    className="mt-1 w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-600">Start Date</label>
                  <input
                    type="month"
                    value={exp.startDate}
                    onChange={(e) =>
                      updateArrayItem("workExperience", index, "startDate", e.target.value)
                    }
                    className="mt-1 w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-600">End Date</label>
                  <input
                    type="month"
                    value={exp.endDate}
                    onChange={(e) =>
                      updateArrayItem("workExperience", index, "endDate", e.target.value)
                    }
                    className="mt-1 w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-600">Description</label>
                <textarea
                  rows="3"
                  placeholder="Describe your role/responsibilities"
                  value={exp.description}
                  onChange={(e) =>
                    updateArrayItem("workExperience", index, "description", e.target.value)
                  }
                  className="mt-1 w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="flex justify-end">
                {resumeData.workExperience.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeArrayItem("workExperience", index)}
                    className="text-red-600 text-sm hover:underline"
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>
          ))}

          <button
            type="button"
            onClick={() =>
              addArrayItem("workExperience", {
                company: "",
                role: "",
                startDate: "",
                endDate: "",
                description: "",
              })
            }
            className="text-sm text-purple-600 hover:underline mt-4"
          >
            + Add More Experience
          </button>
        </div>
      );
case "education-info":
  return (
    <div className="space-y-6 p-4 sm:p-6">
      <h2 className="text-2xl font-semibold text-gray-800">Education</h2>

      {resumeData.education.map((edu, index) => (
        <div key={index} className="border p-4 rounded-md space-y-4 bg-gray-50">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-600">Degree</label>
              <input
                type="text"
                placeholder="Degree (e.g., B.Tech, MBA)"
                value={edu.degree}
                onChange={(e) =>
                  updateArrayItem("education", index, "degree", e.target.value)
                }
                className="mt-1 w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-600">Institution</label>
              <input
                type="text"
                placeholder="Institution Name"
                value={edu.institution}
                onChange={(e) =>
                  updateArrayItem("education", index, "institution", e.target.value)
                }
                className="mt-1 w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-600">Start Date</label>
              <input
                type="month"
                value={edu.startDate}
                onChange={(e) =>
                  updateArrayItem("education", index, "startDate", e.target.value)
                }
                className="mt-1 w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-600">End Date</label>
              <input
                type="month"
                value={edu.endDate}
                onChange={(e) =>
                  updateArrayItem("education", index, "endDate", e.target.value)
                }
                className="mt-1 w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>

          <div className="flex justify-end">
            {resumeData.education.length > 1 && (
              <button
                type="button"
                onClick={() => removeArrayItem("education", index)}
                className="text-red-600 text-sm hover:underline"
              >
                Remove
              </button>
            )}
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={() =>
          addArrayItem("education", {
            degree: "",
            institution: "",
            startDate: "",
            endDate: "",
          })
        }
        className="text-sm text-purple-600 hover:underline mt-4"
      >
        + Add More Education
      </button>
    </div>
  );
case "skills":
  return (
    <div className="space-y-6 p-4 sm:p-6">
      <h2 className="text-2xl font-semibold text-gray-800">Skills</h2>

      {resumeData.skills.map((skill, index) => (
        <div key={index} className="border p-4 rounded-md space-y-4 bg-gray-50">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-600">Skill Name</label>
              <input
                type="text"
                placeholder="e.g., JavaScript, React"
                value={skill.name}
                onChange={(e) =>
                  updateArrayItem("skills", index, "name", e.target.value)
                }
                className="mt-1 w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-600">Proficiency (%)</label>
              <input
                type="number"
                placeholder="1 - 100"
                value={skill.progress}
                min="1"
                max="100"
                onChange={(e) =>
                  updateArrayItem("skills", index, "progress", e.target.value)
                }
                className="mt-1 w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>

          <div className="flex justify-end">
            {resumeData.skills.length > 1 && (
              <button
                type="button"
                onClick={() => removeArrayItem("skills", index)}
                className="text-red-600 text-sm hover:underline"
              >
                Remove
              </button>
            )}
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={() =>
          addArrayItem("skills", { name: "", progress: 0 })
        }
        className="text-sm text-purple-600 hover:underline mt-4"
      >
        + Add More Skill
      </button>
    </div>
  );
case "projects":
  return (
    <div className="space-y-6 p-4 sm:p-6">
      <h2 className="text-2xl font-semibold text-gray-800">Projects</h2>

      {resumeData.projects.map((project, index) => (
        <div key={index} className="border p-4 rounded-md space-y-4 bg-gray-50">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            <div>
              <label className="text-sm font-medium text-gray-600">Project Title</label>
              <input
                type="text"
                placeholder="Project Name"
                value={project.title}
                onChange={(e) =>
                  updateArrayItem("projects", index, "title", e.target.value)
                }
                className="mt-1 w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-600">GitHub Link</label>
              <input
                type="text"
                placeholder="https://github.com/username/repo"
                value={project.github}
                onChange={(e) =>
                  updateArrayItem("projects", index, "github", e.target.value)
                }
                className="mt-1 w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-600">Live Demo Link</label>
              <input
                type="text"
                placeholder="https://yourproject.com"
                value={project.liveDemo}
                onChange={(e) =>
                  updateArrayItem("projects", index, "liveDemo", e.target.value)
                }
                className="mt-1 w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-600">Project Description</label>
            <textarea
              rows="3"
              placeholder="Brief description of your project"
              value={project.description}
              onChange={(e) =>
                updateArrayItem("projects", index, "description", e.target.value)
              }
              className="mt-1 w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div className="flex justify-end">
            {resumeData.projects.length > 1 && (
              <button
                type="button"
                onClick={() => removeArrayItem("projects", index)}
                className="text-red-600 text-sm hover:underline"
              >
                Remove
              </button>
            )}
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={() =>
          addArrayItem("projects", {
            title: "",
            description: "",
            github: "",
            liveDemo: "",
          })
        }
        className="text-sm text-purple-600 hover:underline mt-4"
      >
        + Add More Project
      </button>
    </div>
  );
case "certifications":
  return (
    <div className="space-y-6 p-4 sm:p-6">
      <h2 className="text-2xl font-semibold text-gray-800">Certifications</h2>

      {resumeData.certifications.map((cert, index) => (
        <div key={index} className="border p-4 rounded-md space-y-4 bg-gray-50">
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            <div>
              <label className="text-sm font-medium text-gray-600">Certification Title</label>
              <input
                type="text"
                placeholder="e.g. AWS Certified Solutions Architect"
                value={cert.title}
                onChange={(e) =>
                  updateArrayItem("certifications", index, "title", e.target.value)
                }
                className="mt-1 w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-600">Issuer</label>
              <input
                type="text"
                placeholder="Issuing Organization"
                value={cert.issuer}
                onChange={(e) =>
                  updateArrayItem("certifications", index, "issuer", e.target.value)
                }
                className="mt-1 w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-600">Year</label>
              <input
                type="text"
                placeholder="Year of Certification"
                value={cert.year}
                onChange={(e) =>
                  updateArrayItem("certifications", index, "year", e.target.value)
                }
                className="mt-1 w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

          </div>

          <div className="flex justify-end">
            {resumeData.certifications.length > 1 && (
              <button
                type="button"
                onClick={() => removeArrayItem("certifications", index)}
                className="text-red-600 text-sm hover:underline"
              >
                Remove
              </button>
            )}
          </div>

        </div>
      ))}

      <button
        type="button"
        onClick={() =>
          addArrayItem("certifications", {
            title: "",
            issuer: "",
            year: "",
          })
        }
        className="text-sm text-purple-600 hover:underline mt-4"
      >
        + Add More Certification
      </button>
    </div>
  );
case "additionalInfo":
  return (
    <div className="space-y-6 p-4 sm:p-6">
      <h2 className="text-2xl font-semibold text-gray-800">Additional Information</h2>

      {/* Languages Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-700">Languages</h3>
        
        {resumeData.languages.map((lang, index) => (
          <div key={index} className="border p-4 rounded-md bg-gray-50 space-y-4">
            
            <div>
              <label className="text-sm font-medium text-gray-600">Language</label>
              <input
                type="text"
                placeholder="e.g. English"
                value={lang.name}
                onChange={(e) =>
                  updateArrayItem("languages", index, "name", e.target.value)
                }
                className="mt-1 w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-600">Proficiency (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                placeholder="e.g. 90"
                value={lang.progress}
                onChange={(e) =>
                  updateArrayItem("languages", index, "progress", e.target.value)
                }
                className="mt-1 w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div className="flex justify-end">
              {resumeData.languages.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeArrayItem("languages", index)}
                  className="text-red-600 text-sm hover:underline"
                >
                  Remove
                </button>
              )}
            </div>
          </div>
        ))}

        <button
          type="button"
          onClick={() =>
            addArrayItem("languages", { name: "", progress: 0 })
          }
          className="text-sm text-purple-600 hover:underline mt-2"
        >
          + Add More Language
        </button>
      </div>

      {/* Interests Section */}
      <div className="space-y-4 pt-6">
        <h3 className="text-lg font-medium text-gray-700">Interests</h3>

        {resumeData.interests.map((interest, index) => (
          <div key={index} className="flex items-center gap-4">
            
            <input
              type="text"
              placeholder="e.g. Reading, Traveling"
              value={interest}
              onChange={(e) =>
                updateArrayItem("interests", index, null, e.target.value)
              }
              className="mt-1 w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />

            {resumeData.interests.length > 1 && (
              <button
                type="button"
                onClick={() => removeArrayItem("interests", index)}
                className="text-red-600 text-sm hover:underline"
              >
                Remove
              </button>
            )}
          </div>
        ))}

        <button
          type="button"
          onClick={() => addArrayItem("interests", "")}
          className="text-sm text-purple-600 hover:underline mt-2"
        >
          + Add More Interest
        </button>
      </div>
    </div>
  );


    default:
      return null;
  }
};


  const updateSection = (section, key, value) => {
    setResumeData((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value,
      },
    }))
  }

  const updateArrayItem = (section, index, key, value) => {
    setResumeData((prev) => {
      const updatedArray = [...prev[section]]

      if (key === null) {
        updatedArray[index] = value
      } else {
        updatedArray[index] = {
          ...updatedArray[index],
          [key]: value,
        }
      }

      return {
        ...prev,
        [section]: updatedArray,
      }
    })
  }

const addArrayItem = (section, newItem) => {
    setResumeData((prev) => ({
      ...prev,
      [section]: [...prev[section], newItem],
    }))
  }

  const removeArrayItem = (section, index) => {
    setResumeData((prev) => {
      const updatedArray = [...prev[section]]
      updatedArray.splice(index, 1)
      return {
        ...prev,
        [section]: updatedArray,
      }
    })
  }


  const fetchResumeDetailsById = async () => {
    try {
      const response = await axiosInstance.get(API_PATHS.RESUME.GET_BY_ID(resumeId))

      if (response.data && response.data.profileInfo) {
        const resumeInfo = response.data

        setResumeData((prevState) => ({
          ...prevState,
          title: resumeInfo?.title || "Untitled",
          template: resumeInfo?.template || prevState?.template,
          profileInfo: resumeInfo?.profileInfo || prevState?.profileInfo,
          contactInfo: resumeInfo?.contactInfo || prevState?.contactInfo,
          workExperience: resumeInfo?.workExperience || prevState?.workExperience,
          education: resumeInfo?.education || prevState?.education,
          skills: resumeInfo?.skills || prevState?.skills,
          projects: resumeInfo?.projects || prevState?.projects,
          certifications: resumeInfo?.certifications || prevState?.certifications,
          languages: resumeInfo?.languages || prevState?.languages,
          interests: resumeInfo?.interests || prevState?.interests,
        }))
      }
    } 
    catch (error) {
      console.error("Error fetching resume:", error)
      toast.error("Failed to load resume data")
    }
  }

  const uploadResumeImages = async () => {
    try {
      setIsLoading(true)

      const thumbnailElement = thumbnailRef.current
      if (!thumbnailElement) {
        throw new Error("Thumbnail element not found")
      }

      const fixedThumbnail = fixTailwindColors(thumbnailElement);
document.body.appendChild(fixedThumbnail); // append to DOM so canvas can render


      const thumbnailCanvas = await html2canvas(fixedThumbnail, {
        scale: 0.5,
        backgroundColor: "#FFFFFF",
        logging: false,
      })

      document.body.removeChild(fixedThumbnail)

      const thumbnailDataUrl = thumbnailCanvas.toDataURL("image/png")
      const thumbnailFile = dataURLtoFile(
        thumbnailDataUrl,
        `thumbnail-${resumeId}.png`
      )

      const formData = new FormData()
      formData.append("thumbnail", thumbnailFile)

      const uploadResponse = await axiosInstance.put(
        API_PATHS.RESUME.UPLOAD_IMAGES(resumeId),
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      )

      const { thumbnailLink } = uploadResponse.data
      await updateResumeDetails(thumbnailLink)

      toast.success("Resume Updated Successfully")
      navigate("/dashboard")
    } catch (error) {
      console.error("Error Uploading Images:", error)
      toast.error("Failed to upload images")
    } finally {
      setIsLoading(false)
    }
  }

 const updateResumeDetails = async (thumbnailLink) => {
    try {
      setIsLoading(true)

      await axiosInstance.put(API_PATHS.RESUME.UPDATE(resumeId), {
        ...resumeData,
        thumbnailLink: thumbnailLink || "",
        completion: completionPercentage,
      })
    } catch (err) {
      console.error("Error updating resume:", err)
      toast.error("Failed to update resume details")
    } finally {
      setIsLoading(false)
    }
  }

    const handleDeleteResume = async () => {
    try {
      setIsLoading(true)
      await axiosInstance.delete(API_PATHS.RESUME.DELETE(resumeId))
      toast.success("Resume deleted successfully")
      navigate("/dashboard")
    } catch (error) {
      console.error("Error deleting resume:", error)
      toast.error("Failed to delete resume")
    } finally {
      setIsLoading(false)
    }
  }

  const downloadPDF = async () => {
    const element = resumeDownloadRef.current;
    if (!element) {
      toast.error("Failed to generate PDF. Please try again.");
      return;
    }
  
    setIsDownloading(true);
    setDownloadSuccess(false);
    const toastId = toast.loading("Generating PDFâ€¦");
  
    const override = document.createElement("style");
    override.id = "__pdf_color_override__";
    override.textContent = `
      * {
        color: #000 !important;
        background-color: #fff !important;
        border-color: #000 !important;
      }
    `;
    document.head.appendChild(override);
  
    try {
      await html2pdf()
        .set({
          margin:       0,
          filename:     `${resumeData.title.replace(/[^a-z0-9]/gi, "_")}.pdf`,
          image:        { type: "png", quality: 1.0 },
          html2canvas:  {
            scale:           2,
            useCORS:         true,
            backgroundColor: "#FFFFFF",
            logging:         false,
            windowWidth:     element.scrollWidth,
          },
          jsPDF:        {
            unit:       "mm",
            format:     "a4",
            orientation:"portrait",
          },
          pagebreak: {
            mode: ['avoid-all', 'css', 'legacy']
          }
        })
        .from(element)
        .save();
  
      toast.success("PDF downloaded successfully!", { id: toastId });
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 3000);
  
    } catch (err) {
      console.error("PDF error:", err);
      toast.error(`Failed to generate PDF: ${err.message}`, { id: toastId });
  
    } finally {
      document.getElementById("__pdf_color_override__")?.remove();
      setIsDownloading(false);
    }
  };

  const updateTheme = (theme) => {
    setResumeData(prev => ({
      ...prev,
      template: {
        theme: theme,
        colorPalette: []
      }
    }));
  }

  useEffect(() => {
    if (resumeId) {
      fetchResumeDetailsById()
    }
  }, [resumeId])

  return (
<DashboardLayout>
    <div className={containerStyles.main}>
        <div className={containerStyles.header}>
        <TitleInput title={resumeData.title}
        setTitle={(value) => setResumeData((prev) => ({
            ...prev,
            title: value,
        }))
        }>
        
        </TitleInput>
        <div className='flex flex-wrap items-center gap-3'>
            <button onClick={() => setOpenThemeSelector(true)} className={buttonStyles.theme}>
            <Palette size={16} />
            <span className='text-sm'>Theme</span>
            </button>

            <button onClick={handleDeleteResume} className={buttonStyles.delete} disabled={isLoading}>
                <Trash2 size={16}/>
                <span className='text-sm'>Delete</span>

            </button>
            <button onClick={() => setOpenPreviewModal(true)} className={buttonStyles.download}>
                <Download size={16}/>
                <span className='text-sm'>Preview</span>
            </button>
        </div>
        </div>
        <div className={containerStyles.grid}>
        <div className={containerStyles.formContainer}>
        <StepProgress progress={progress}/>
        {renderForm()}
        <div className='p-4 sm:p-6'>
{errorMsg && (
    <div className={statusStyles.error}>
        <AlertCircle size={16} />
    {errorMsg}
    </div>
)}
<div className='flex flex-wrap items-center justify-end gap-3'>
    <button className={buttonStyles.back} onClick={goBack} disabled={isLoading}>
        <ArrowLeft size={16}/>
        Back
    </button>
<button className={buttonStyles.save} onClick={uploadResumeImages} disabled={isLoading}> 
{isLoading ? <Loader2 size={16} className='animate-spin'/>
: <Save size={16} />}
{isLoading ? 'Saving...' : 'Save & Exit'}
</button>

<button className={buttonStyles.next} onClick={validateAndNext} disabled={isLoading}>
  {currentPage === 'additionalInfo' && <Download size={16}/>}
  {currentPage === 'additionalInfo' ?'Preview & Download' : 'Next'}
  {currentPage === 'additionalInfo' && <ArrowLeft size={16} className='rotate-180' />}

</button>
</div>
        </div>
        </div>
       <div className="hidden lg:block">
  <div className={containerStyles.previewContainer}>
    <div className="text-center mb-4">
      <div className={statusStyles.completionBadge}>
        <div className="flex items-center justify-center gap-2">
          {/* Pulse Dot Icon */}
          <div className="w-1 h-1 bg-green-500 rounded-full animate-ping relative">
            <div className="absolute top-0 left-0 w-full h-full bg-green-500 rounded-full"></div>
          </div>

          {/* Completion Text */}
          <span className="text-sm font-medium text-gray-700">
            Preview - {completionPercentage}% Complete
          </span>
        </div>
      </div>
      <div className='preview-container relative' ref={previewContainerRef}>
        <div className={containerStyles.previewContainer}>
          <RenderResume key={`preview-${resumeData?.template?.theme}`}
          templateId={resumeData?.template?.theme || ''}
          resumeData={resumeData}
          containerWidth={previewWidth}
          />
        </div>

      </div>
    </div>
  </div>
</div>

        </div>
    </div>
    <Modal isOpen={openThemeSelector} onClose={() => setOpenThemeSelector(false)}
      title='Change Title'>
        <div className={containerStyles.modalContent}>
          <ThemeSelector selectedTheme={resumeData?.template.theme}
          setSelectedTheme={updateTheme} onClose={() => setOpenThemeSelector(false)}
          />
          </div>
            </Modal>
          <Modal isOpen={openPreviewModal} onClose={() => setOpenPreviewModal(false)}
            title={resumeData.title}
            showActionBtn
            actionBtnText={isDownloading ? 'Generating...'
              : downloadSuccess ? 'Downloaded' : 'Download PDF'}
            
            actionBtnIcon={
              isDownloading ? (
                <Loader2 size={16} className='animate-spin'/>
              ) : 
                downloadSuccess ? (
                  <Check size={16} className='text-white'/>
                
                ) : (
                  <Download size={16} />
                )
            }
            onActionClick={downloadPDF}
        >
            <div className='relative'>
              <div className='text-center'>
              <div className={statusStyles.modalBadge}>
                <div className={iconStyles.pulseDot}></div>
                <span>Completion: {completionPercentage}%</span>
              </div>
              </div>
              <div className={containerStyles.pdfPreview}>
              <div ref={resumeDownloadRef} className='a4-wrapper'>
                <div className='w-full h-full'>
              <RenderResume key={`pdf-${resumeData?.template?.theme}`}  
            templateId={resumeData?.template?.theme || ''
            }
                resumeData={resumeData}
                containerWidth={null}
                />

                </div>

              </div>
              </div>
            </div>
          </Modal>

        <div style={{display: 'none'}} ref={thumbnailRef}>
              <div className={containerStyles.hiddenThumbnail}>
              <RenderResume key={`thumb-${resumeData?.template?.theme}`}
              templateId={resumeData?.template?.theme || ''}
              resumeData={resumeData}
              />
              </div>
        </div>
      
</DashboardLayout>  )
}

export default EditResume
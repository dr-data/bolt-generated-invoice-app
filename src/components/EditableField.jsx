import React, { useState, useRef, useEffect } from 'react'

function EditableField({ value, onSave, className, darkMode = false }) {
  const [isEditing, setIsEditing] = useState(false)
  const [editedValue, setEditedValue] = useState(value)
  const inputRef = useRef(null)

  useEffect(() => {
    if (isEditing) {
      inputRef.current.focus()
    }
  }, [isEditing])

  const handleClick = () => {
    setIsEditing(true)
  }

  const handleBlur = () => {
    setIsEditing(false)
    if (editedValue !== value) {
      onSave(editedValue)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleBlur()
    } else if (e.key === 'Escape') {
      setEditedValue(value)
      setIsEditing(false)
    }
  }

  return isEditing ? (
    <input
      ref={inputRef}
      type="text"
      value={editedValue}
      onChange={(e) => setEditedValue(e.target.value)}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      className={`form-input ${className} ${darkMode ? 'text-black bg-white' : ''} border-none outline-none`}
    />
  ) : (
    <span onClick={handleClick} className={`cursor-pointer ${className}`}>
      {value}
    </span>
  )
}

export default EditableField

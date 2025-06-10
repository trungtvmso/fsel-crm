
import React, { useContext } from 'react';
import { Student } from '../types';
import { getCustomerTypeDisplay, formatDate } from '../utils';
import { LanguageContext } from '../contexts/LanguageContext';

interface DesktopStudentListRowProps {
  student: Student;
  index: number;
  onSelectStudent: (student: Student) => void;
  isSelected: boolean;
}

const DesktopStudentListRow: React.FC<DesktopStudentListRowProps> = ({ student, index, onSelectStudent, isSelected }) => {
  const { translate } = useContext(LanguageContext)!;
  const doiTuongDisplay = getCustomerTypeDisplay(student.object, translate);
  const doiTuongClass = student.object === 'Leads' ? 'text-yellow-400' : student.object === 'Client' ? 'text-green-400' : 'text-slate-400';
  
  const sttWidth = 'w-[5%]';
  const hoTenWidth = 'w-[30%]';
  const truongWidth = 'w-[20%]';
  const lopWidth = 'w-[15%]';
  const doiTuongWidth = 'w-[15%]';
  const goiHocWidth = 'w-[15%]';

  const baseTextSize = 'text-sm md:text-base';

  return (
    <tr 
      className={`hover:bg-slate-800 cursor-pointer ${isSelected ? 'bg-indigo-700 text-white ring-1 ring-indigo-500' : 'text-slate-300'}`}
      onClick={() => onSelectStudent(student)}
      aria-selected={isSelected}
    >
      <td className={`px-2 md:px-3 py-2 md:py-2.5 whitespace-nowrap text-center ${baseTextSize} ${sttWidth}`}>{index + 1}</td>
      <td className={`px-2 md:px-3 py-2 md:py-2.5 whitespace-nowrap font-medium ${isSelected ? 'text-white' : 'text-slate-100'} ${baseTextSize} ${hoTenWidth}`}>{student.fullName || 'N/A'}</td>
      <td className={`px-2 md:px-3 py-2 md:py-2.5 whitespace-nowrap ${baseTextSize} ${truongWidth}`}>{student.schoolName || 'N/A'}</td>
      <td className={`px-2 md:px-3 py-2 md:py-2.5 whitespace-nowrap ${baseTextSize} ${lopWidth}`}>{student.class || 'N/A'}</td>
      <td className={`px-2 md:px-3 py-2 md:py-2.5 whitespace-nowrap font-semibold ${doiTuongClass} ${baseTextSize} ${doiTuongWidth}`}>{doiTuongDisplay}</td>
      <td className={`px-2 md:px-3 py-2 md:py-2.5 whitespace-nowrap ${goiHocWidth}`}>
        <span className={`px-2 py-0.5 inline-flex text-xs md:text-sm leading-5 font-semibold rounded-full ${
            student.status === 'Active' || student.status === 'Đang học' ? 'bg-green-800 text-green-200' : 
            student.status === 'Inactive' || student.status === 'Đã nghỉ' || student.status === 'Hết hạn' ? 'bg-red-800 text-red-200' : 
            'bg-slate-700 text-slate-300'
          }`}>
          {student.status || 'N/A'}
        </span>
      </td>
    </tr>
  );
};

export default DesktopStudentListRow;

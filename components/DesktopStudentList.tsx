
import React, { useContext } from 'react';
import { Student } from '../types';
import DesktopStudentListRow from './DesktopStudentListRow';
import LoadingSpinner from './LoadingSpinner';
import { LanguageContext } from '../contexts/LanguageContext';

interface DesktopStudentListProps {
  students: Student[];
  onSelectStudent: (student: Student) => void;
  selectedStudentId: string | null;
  isLoading: boolean;
  initialSearchDone: boolean;
}

const DesktopStudentList: React.FC<DesktopStudentListProps> = ({ students, onSelectStudent, selectedStudentId, isLoading, initialSearchDone }) => {
  const { translate } = useContext(LanguageContext)!;

  const headers = [
    { name: translate('desktopStudentList.headers.stt'), width: 'w-[5%]' },
    { name: translate('desktopStudentList.headers.fullName'), width: 'w-[30%]' },
    { name: translate('desktopStudentList.headers.school'), width: 'w-[20%]' },
    { name: translate('desktopStudentList.headers.class'), width: 'w-[15%]' },
    { name: translate('desktopStudentList.headers.customerType'), width: 'w-[15%]' },
    { name: translate('desktopStudentList.headers.package'), width: 'w-[15%]' },
  ];

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {isLoading && (
        <div className="flex-grow flex items-center justify-center p-4">
          <LoadingSpinner text={translate('desktopStudentList.loading')} size="md"/>
        </div>
      )}
      {!isLoading && students.length > 0 && (
        <>
          <div className="overflow-x-auto flex-shrink-0">
            <table className="min-w-full text-sm md:text-lg table-fixed w-full">
              <thead className="bg-slate-700 sticky top-0 z-10">
                <tr>
                  {headers.map(header => (
                    <th 
                      key={header.name} 
                      scope="col" 
                      className={`px-2 md:px-3 py-2 md:py-2.5 text-left text-xs md:text-base font-medium text-slate-400 uppercase tracking-wider ${header.width}`}
                    >
                      {header.name}
                    </th>
                  ))}
                </tr>
              </thead>
            </table>
          </div>
          <div className="overflow-y-auto flex-grow">
            <table className="min-w-full divide-y divide-slate-700 text-sm md:text-lg table-fixed w-full">
              <tbody className="bg-slate-850 divide-y divide-slate-700">
                {students.map((student, index) => (
                  <DesktopStudentListRow
                    key={student.id}
                    index={index}
                    student={student}
                    onSelectStudent={onSelectStudent}
                    isSelected={student.id === selectedStudentId}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
      {!isLoading && students.length === 0 && initialSearchDone && (
        <div className="flex-grow flex items-center justify-center p-4">
          <p className="text-slate-400 text-center text-base md:text-xl">{translate('desktopStudentList.noStudentsFound')}</p>
        </div>
      )}
      {!isLoading && students.length === 0 && !initialSearchDone && (
        <div className="flex-grow flex items-center justify-center p-4">
          <p className="text-slate-400 text-center text-base md:text-xl">{translate('desktopStudentList.performSearch')}</p>
        </div>
      )}
    </div>
  );
};

export default DesktopStudentList;

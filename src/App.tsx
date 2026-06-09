import { UploadArea } from './components/UploadArea/UploadArea';

function App() {

  return (
    <>
      <UploadArea onFilesSelected={(files) => console.log(files)}/>
    </>
  )
}

export default App

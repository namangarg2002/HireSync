import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import toast from 'react-hot-toast';
import confetti from "canvas-confetti";
import { Panel, Group, Separator } from 'react-resizable-panels'
import { PROBLEMS } from '../data/problems';
import Navbar from '../components/Navbar';
import ProblemDescription from '../components/ProblemDescription';
import CodeEditorPanel from '../components/CodeEditorPanel'
import OutputPanel from '../components/OutputPanel';
import { executeCode } from '../lib/excecuteCodeEditor';

function ProbPage() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [currentProblemId, setCurrentProblemId] = useState("two-sum");
    const [selectedLanguage, setSelectedLanguage] = useState("javascript");
    const [code, setCode] = useState(PROBLEMS[currentProblemId].starterCode.javascript);

    const [output, setOutput] = useState(null);
    const [isRunning, setIsRunning] = useState(false);

    const currentProblem = PROBLEMS[currentProblemId];

    // update problem when URLparams changes
    useEffect(() => {
        if(id && PROBLEMS[id]){
            setCurrentProblemId(id);
            setCode(PROBLEMS[id].starterCode[selectedLanguage]);
            setOutput(null);
        }
    }, [id, selectedLanguage])

    const handleLanguageChange = (newLanguage) => {
        setSelectedLanguage(newLanguage);
        setCode(currentProblem.starterCode[newLanguage]);
        setOutput(null)
    }

    const handleProblemChange = (newProblemId) => {
        navigate(`/problem/${newProblemId}`)
    }

    const triggerConfetti = () => {
        confetti({
            particleCount: 80,
            spread: 250,
            origin: { x: 0.2, y: 0.6 },
        });

        confetti({
            particleCount: 80,
            spread: 250,
            origin: { x: 0.8, y: 0.6 },
        });
    };

    const normalizeOutput = (output) => {
        return output
        .trim()
        .split("\n")
        .map((line) =>
        line
            .trim()
            // remove spaces after [ and before ]
            .replace(/\[\s+/g, "[")
            .replace(/\s+\]/g, "]")
            // normalize spaces around commas
            .replace(/\s*,\s*/g, ",")
        )
        .filter((line) => line.length > 0)
        .join("\n");
    } 

    const checkIfTestsPassed = (actualOutput, expectedOutput) => {
        const normalizedActualOutput = normalizeOutput(actualOutput)
        const normalizedExpectedOutput = normalizeOutput(expectedOutput)
        return normalizedActualOutput === normalizedExpectedOutput;
    }

    const handleRunCode = async () => {
        setIsRunning(true);
        setOutput(null);

        const result = await executeCode(selectedLanguage, code);

        console.log("results are :", result)
        setIsRunning(false)

        if(!result.success){

            setOutput(result)
            toast.error("Execution Error")

            return
        }

        setOutput(result)

        const expectedOutput = currentProblem.expectedOutput[selectedLanguage]

        const testsPassed = checkIfTestsPassed(result.output, expectedOutput)

        if(testsPassed){
            triggerConfetti();
            toast.success("All tests passed! Great Job")
        }else{
            toast.error("Test failed. Check your Output")
        }

    }

  return (
    <div className='h-screen bg-base-100 flex flex-col'>
        <Navbar />

        <div className='flex-1'>
            <Group orientation="horizontal">
                {/* Left Panel - Problem Desc */}
                <Panel defaultSize={40} minSize={30}>
                    <ProblemDescription
                        problemId={currentProblemId} 
                        problem={currentProblem}
                        onProblemChange={handleProblemChange}
                        allProblems={Object.values(PROBLEMS)}
                    />
                </Panel>

                <Separator className='w-2 bg-base-300 hover:bg-primary transition-colors cursor-col-resize' />

                {/* Right Panel - Code Editor & output */} 
                <Panel defaultSize={50} minSize={30}>
                    <Group orientation="vertical">
                        {/* Top panel Code Editor */}
                        <Panel defaultSize={70} minSize={30}>
                            <CodeEditorPanel
                                selectedLanguage={selectedLanguage}
                                code={code}
                                isRunning={isRunning}
                                onLanguageChange={handleLanguageChange}
                                onCodeChange={setCode}
                                onRunCode={handleRunCode}
                            />
                        </Panel>

                        <Separator className='h-2 bg-base-300 hover:bg-primary transition-colors cursor-row-resize' />

                        {/* Bottom Output Panel */}
                        <Panel defaultSize={30} minSize={20}>
                            <OutputPanel
                                output={output}
                            />
                        </Panel>
                    </Group>
                </Panel>

            </Group>
        </div>
    </div>
  )
}

export default ProbPage
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export function MessageBubble({ role, text, image }: { role: string; text: string; image?: string }) {
  const isUser = role === 'user';

  if (isUser) {
    return (
      <div className="flex flex-col items-end w-full mb-6">
        {image && (
          <img src={image} alt="User upload" className="max-w-[200px] sm:max-w-[250px] rounded-2xl mb-2 shadow-sm border border-gray-200 dark:border-gray-700 object-cover" />
        )}
        {text && (
          <div className="max-w-[85%] sm:max-w-[75%] rounded-3xl rounded-tr-sm bg-gray-800 dark:bg-gray-200 text-white dark:text-gray-900 px-4 sm:px-5 py-2.5 sm:py-3 shadow-sm whitespace-pre-wrap transition-colors duration-300 text-sm sm:text-base">
            {text}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex w-full mb-6 gap-3 sm:gap-4">
      <div className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-black dark:bg-white text-white dark:text-black font-bold text-xs shadow-md transition-colors duration-300 mt-0.5">
        AI
      </div>
      
      <div className="flex-1 pt-1 text-gray-800 dark:text-gray-200 leading-relaxed overflow-hidden transition-colors duration-300 text-sm sm:text-base">
        <ReactMarkdown 
          remarkPlugins={[remarkGfm]}
          components={{
            p: ({node, ...props}) => <p className="mb-3 sm:mb-4 last:mb-0" {...props} />,
            strong: ({node, ...props}) => <strong className="font-semibold text-black dark:text-white" {...props} />,
            ul: ({node, ...props}) => <ul className="list-disc pl-4 sm:pl-5 mb-3 sm:mb-4 space-y-1" {...props} />,
            ol: ({node, ...props}) => <ol className="list-decimal pl-4 sm:pl-5 mb-3 sm:mb-4 space-y-1" {...props} />,
            li: ({node, ...props}) => <li className="pl-1" {...props} />,
            h1: ({node, ...props}) => <h1 className="text-lg sm:text-xl font-bold mb-2 sm:mb-3 mt-5 sm:mt-6 text-black dark:text-white" {...props} />,
            h2: ({node, ...props}) => <h2 className="text-base sm:text-lg font-bold mb-2 mt-4 sm:mt-5 text-black dark:text-white" {...props} />,
            h3: ({node, ...props}) => <h3 className="text-sm sm:text-md font-bold mb-2 mt-3 sm:mt-4 text-black dark:text-white" {...props} />,
            code: ({node, inline, ...props}: any) => 
              inline ? (
                <code className="bg-gray-100 dark:bg-gray-800 text-pink-600 dark:text-pink-400 px-1.5 py-0.5 rounded text-xs sm:text-sm font-mono" {...props} />
              ) : (
                <pre className="bg-gray-900 dark:bg-black text-gray-100 p-3 sm:p-4 rounded-xl overflow-x-auto mb-4 text-xs sm:text-sm font-mono border border-gray-800">
                  <code {...props} />
                </pre>
              ),
            table: ({node, ...props}) => (
              <div className="overflow-x-auto mb-4 sm:mb-6 mt-2 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm">
                <table className="min-w-full text-xs sm:text-sm text-left" {...props} />
              </div>
            ),
            thead: ({node, ...props}) => <thead className="text-[10px] sm:text-xs uppercase bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700" {...props} />,
            tbody: ({node, ...props}) => <tbody className="divide-y divide-gray-200 dark:divide-gray-700" {...props} />,
            tr: ({node, ...props}) => <tr className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors" {...props} />,
            th: ({node, ...props}) => <th className="px-3 sm:px-4 py-2 sm:py-3 font-semibold text-gray-900 dark:text-white border-r border-gray-200 dark:border-gray-700 last:border-r-0" {...props} />,
            td: ({node, ...props}) => <td className="px-3 sm:px-4 py-2 sm:py-3 border-r border-gray-200 dark:border-gray-700 last:border-r-0" {...props} />,
          }}
        >
          {text}
        </ReactMarkdown>
      </div>
    </div>
  );
}
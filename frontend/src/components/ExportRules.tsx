import React from 'react';
import { Button, message } from 'antd';
import { ExportOutlined } from '@ant-design/icons';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from 'docx';
import { saveAs } from 'file-saver';
import type { FormInstance } from 'antd';
import type { ScoringConfig } from '../types';

interface ExportRulesProps {
  form: FormInstance<ScoringConfig>;
}

const ExportRules: React.FC<ExportRulesProps> = ({ form }) => {
  // 导出规则为 Word 文档
  const handleExportRules = async () => {
    try {
      const config = form.getFieldsValue();
      
      // 生成评标基准价规则文本
      const generateBenchmarkRules = (): string[] => {
        const rules: string[] = [];
        const outlierRules = config.outlier_rules || [];
        const kFactor = config.k_factor || 0.95;
        
        if (outlierRules.length === 0) {
          const kText = kFactor !== 1 ? `乘以${kFactor}` : '';
          rules.push(`(1) 取所有有效投标报价的算术平均值${kText}作为评标基准价。`);
          return rules;
        }
        
        outlierRules.forEach((rule: any, index: number) => {
          const minCount = rule.min_count || 0;
          const maxCount = rule.max_count;
          const removeHigh = rule.remove_high || 0;
          const removeLow = rule.remove_low || 0;
          
          let condition = '';
          if (maxCount !== undefined && maxCount !== null) {
            condition = `当有效投标人数量≥${minCount}家且<${maxCount}家时`;
          } else {
            condition = `当有效投标人数量≥${minCount}家时`;
          }
          
          let action = '';
          if (removeHigh > 0 && removeLow > 0) {
            action = `扣除${removeHigh}个最高有效投标报价和${removeLow}个最低有效投标报价`;
          } else if (removeHigh > 0) {
            action = `扣除${removeHigh}个最高有效投标报价`;
          } else if (removeLow > 0) {
            action = `扣除${removeLow}个最低有效投标报价`;
          } else {
            action = '不扣除任何报价';
          }
          
          const kText = kFactor !== 1 ? `乘以${kFactor}` : '';
          rules.push(`(${index + 1}) ${condition}，${action}，取其余有效投标报价的算术平均值${kText}作为评标基准价。`);
        });
        
        // 检查是否需要添加默认规则
        // 只有当第一条规则的 min_count > 0 时，才需要添加 <min_count 的默认规则
        // 如果第一条规则从 >=0 开始，说明已经覆盖了所有情况，不需要添加默认规则
        const firstRule = outlierRules[0];
        
        if (firstRule && firstRule.min_count > 0) {
          // 第一条规则不是从0开始，需要添加 <min_count 的默认规则
          const defaultKText = kFactor !== 1 ? `乘以${kFactor}` : '';
          rules.push(`(${outlierRules.length + 1}) 当有效投标人数量<${firstRule.min_count}家时，取所有有效投标报价的算术平均值${defaultKText}作为评标基准价。`);
        }
        
        return rules;
      };
      
      // 生成投标报价得分规则文本
      const generateScoringRules = (): string[] => {
        const rules: string[] = [];
        const baseScore = config.base_score || 40;
        const minScore = config.min_score || 0;
        const maxScore = config.max_score || 100;
        
        // 判断是统一规则还是分段规则
        const isMonotonic = config.high_price_type && config.high_price_factor !== undefined;
        
        if (isMonotonic) {
          // 统一规则模式
          const highType = config.high_price_type;
          const highFactor = config.high_price_factor || 0.3;
          const lowType = config.low_price_type;
          const lowFactor = config.low_price_factor || 0.3;
          
          // 根据规则类型确定公式
          if (highType === 'deduct' && lowType === 'deduct') {
            // 都是扣分
            rules.push(`Fi=${baseScore}-（Di-D）/D×100×E，式中：`);
            rules.push(`Fi=价格得分`);
            rules.push(`Di=有效投标人的投标价；`);
            rules.push(`D=评标基准价。`);
            rules.push(`当Di>D时E=${highFactor}；当Di<D时E=${lowFactor}。`);
          } else if (highType === 'deduct' && lowType === 'add') {
            // 高价扣分，低价加分
            rules.push(`Fi=${baseScore}-（Di-D）/D×100×E，式中：`);
            rules.push(`Fi=价格得分`);
            rules.push(`Di=有效投标人的投标价；`);
            rules.push(`D=评标基准价。`);
            rules.push(`当Di>D时E=${highFactor}（扣分）；当Di<D时E=${lowFactor}（加分）。`);
          } else if (highType === 'add' && lowType === 'deduct') {
            // 高价加分，低价扣分
            rules.push(`Fi=${baseScore}+（Di-D）/D×100×E，式中：`);
            rules.push(`Fi=价格得分`);
            rules.push(`Di=有效投标人的投标价；`);
            rules.push(`D=评标基准价。`);
            rules.push(`当Di>D时E=${highFactor}（加分）；当Di<D时E=${lowFactor}（扣分）。`);
          } else {
            // 都是加分
            rules.push(`Fi=${baseScore}+（Di-D）/D×100×E，式中：`);
            rules.push(`Fi=价格得分`);
            rules.push(`Di=有效投标人的投标价；`);
            rules.push(`D=评标基准价。`);
            rules.push(`当Di>D时E=${highFactor}；当Di<D时E=${lowFactor}。`);
          }
        } else {
          // 分段规则模式
          const highRules = config.high_price_rules || [];
          const lowRules = config.low_price_rules || [];
          
          rules.push(`Fi=${baseScore}±（Di-D）/D×100×E，式中：`);
          rules.push(`Fi=价格得分`);
          rules.push(`Di=有效投标人的投标价；`);
          rules.push(`D=评标基准价。`);
          
          if (highRules.length > 0) {
            rules.push(`当Di>D时：`);
            highRules.forEach((rule: any) => {
              const minDev = rule.min_dev || 0;
              const maxDev = rule.max_dev || 100;
              const type = rule.type === 'deduct' ? '扣分' : '加分';
              const factor = rule.factor || 0.3;
              
              if (maxDev === 100) {
                rules.push(`  偏离${minDev}%以上时，E=${factor}（${type}）；`);
              } else {
                rules.push(`  偏离${minDev}%-${maxDev}%时，E=${factor}（${type}）；`);
              }
            });
          }
          
          if (lowRules.length > 0) {
            rules.push(`当Di<D时：`);
            lowRules.forEach((rule: any) => {
              const minDev = rule.min_dev || 0;
              const maxDev = rule.max_dev || 100;
              const type = rule.type === 'deduct' ? '扣分' : '加分';
              const factor = rule.factor || 0.3;
              
              if (maxDev === 100) {
                rules.push(`  偏离${minDev}%以上时，E=${factor}（${type}）；`);
              } else {
                rules.push(`  偏离${minDev}%-${maxDev}%时，E=${factor}（${type}）；`);
              }
            });
          }
        }
        
        // 添加分数限制说明
        if (minScore > 0 || maxScore < 100) {
          rules.push(`最终得分限制在${minScore}分到${maxScore}分之间。`);
        }
        
        return rules;
      };
      
      // 构建 Word 文档内容
      const benchmarkRules = generateBenchmarkRules();
      const scoringRules = generateScoringRules();
      
      const doc = new Document({
        sections: [
          {
            children: [
              new Paragraph({
                text: "评标规则",
                heading: HeadingLevel.HEADING_1,
                alignment: AlignmentType.CENTER,
              }),
              new Paragraph({ text: "" }),
              new Paragraph({
                text: "1. 评标基准价：",
                heading: HeadingLevel.HEADING_2,
              }),
              ...benchmarkRules.map(rule => 
                new Paragraph({
                  children: [
                    new TextRun({
                      text: rule,
                      font: "宋体",
                      size: 22, // 11pt
                    }),
                  ],
                })
              ),
              new Paragraph({ text: "" }),
              new Paragraph({
                text: "2. 投标报价得分：",
                heading: HeadingLevel.HEADING_2,
              }),
              ...scoringRules.map(rule => 
                new Paragraph({
                  children: [
                    new TextRun({
                      text: rule,
                      font: "宋体",
                      size: 22, // 11pt
                    }),
                  ],
                })
              ),
            ],
          },
        ],
      });
      
      // 生成并下载文档
      const blob = await Packer.toBlob(doc);
      saveAs(blob, `评标规则_${new Date().toISOString().slice(0, 10)}.docx`);
      
      message.success('规则导出成功');
    } catch (error) {
      console.error('导出规则失败:', error);
      message.error('导出规则失败');
    }
  };

  return (
    <Button
      type="primary"
      icon={<ExportOutlined />}
      onClick={handleExportRules}
      style={{
        background: '#1890ff',
        borderColor: '#1890ff',
        color: '#fff',
      }}
    >
      导出规则
    </Button>
  );
};

export default ExportRules;


import { PULSE_PIPELINE_TEMPLATES } from '@/pulse-pipelines/constants/PulsePipelineTemplates';
import { useCreatePulsePipeline } from '@/pulse-pipelines/hooks/useCreatePulsePipeline';
import { usePulsePipelines } from '@/pulse-pipelines/hooks/usePulsePipelines';
import { PageCardLayout } from '@/ui/layout/page/components/PageCardLayout';
import { PageHeader } from '@/ui/layout/page/components/PageHeader';
import { CombinedGraphQLErrors } from '@apollo/client/errors';
import { styled } from '@linaria/react';
import { useLingui } from '@lingui/react/macro';
import { useState } from 'react';
import { isDefined } from 'twenty-shared/utils';
import {
  IconArrowDown,
  IconArrowUp,
  IconLayoutKanban,
  IconPlus,
  IconTrash,
} from 'twenty-ui/icon';
import { Tag, type TagColor } from 'twenty-ui/primitives/data-display';
import { themeCssVariables } from 'twenty-ui/theme';

const OPPORTUNITY_BOARD_PATH = '/objects/opportunities';

const StyledScroll = styled.div`
  box-sizing: border-box;
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[6]};
  min-height: 0;
  overflow-y: auto;
  padding: ${themeCssVariables.spacing[6]};
`;

const StyledSectionTitle = styled.h3`
  color: ${themeCssVariables.font.color.primary};
  font-size: ${themeCssVariables.font.size.lg};
  margin: 0 0 ${themeCssVariables.spacing[3]};
`;

const StyledGrid = styled.div`
  display: grid;
  gap: ${themeCssVariables.spacing[3]};
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
`;

const StyledPipelineCard = styled.a`
  background: ${themeCssVariables.background.secondary};
  border: 1px solid ${themeCssVariables.border.color.medium};
  border-radius: 16px;
  color: inherit;
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[3]};
  padding: ${themeCssVariables.spacing[5]};
  text-decoration: none;
  transition: border-color 0.15s;

  &:hover {
    border-color: ${themeCssVariables.accent.accent9};
  }
`;

const StyledCardHeader = styled.div`
  align-items: center;
  display: flex;
  gap: ${themeCssVariables.spacing[2]};
  justify-content: space-between;
`;

const StyledCardTitle = styled.span`
  align-items: center;
  color: ${themeCssVariables.font.color.primary};
  display: flex;
  font-size: ${themeCssVariables.font.size.lg};
  font-weight: ${themeCssVariables.font.weight.semiBold};
  gap: ${themeCssVariables.spacing[2]};
`;

const StyledMuted = styled.span`
  color: ${themeCssVariables.font.color.tertiary};
  font-size: ${themeCssVariables.font.size.sm};
`;

const StyledTags = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${themeCssVariables.spacing[1]};
`;

const StyledBuilder = styled.form`
  background:
    radial-gradient(
      120% 140% at 0% 0%,
      ${themeCssVariables.accent.accent9} 0%,
      transparent 50%
    ),
    #0b0a12;
  border-radius: 20px;
  color: #fff;
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[4]};
  padding: ${themeCssVariables.spacing[8]};
`;

const StyledBuilderTitle = styled.h2`
  font-size: 28px;
  font-weight: 700;
  letter-spacing: -0.02em;
  margin: 0;
`;

const StyledTemplates = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${themeCssVariables.spacing[2]};
`;

const StyledTemplateButton = styled.button`
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.16);
  border-radius: 12px;
  color: #fff;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  font-family: inherit;
  gap: 2px;
  padding: ${themeCssVariables.spacing[2]} ${themeCssVariables.spacing[3]};
  text-align: left;

  span {
    color: rgba(255, 255, 255, 0.6);
    font-size: ${themeCssVariables.font.size.sm};
  }

  &[aria-pressed='true'] {
    background: rgba(255, 255, 255, 0.18);
    border-color: rgba(255, 255, 255, 0.6);
  }
`;

const StyledLabel = styled.label`
  color: rgba(255, 255, 255, 0.7);
  display: flex;
  flex-direction: column;
  font-size: ${themeCssVariables.font.size.sm};
  gap: ${themeCssVariables.spacing[1]};
`;

const StyledInput = styled.input`
  background: rgba(0, 0, 0, 0.35);
  border: 1px solid rgba(255, 255, 255, 0.18);
  border-radius: 10px;
  box-sizing: border-box;
  color: #fff;
  flex: 1;
  font-family: inherit;
  font-size: ${themeCssVariables.font.size.md};
  height: 40px;
  min-width: 0;
  outline: none;
  padding: 0 ${themeCssVariables.spacing[3]};

  &:focus {
    border-color: rgba(255, 255, 255, 0.5);
  }
`;

const StyledStages = styled.ol`
  counter-reset: stage;
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[2]};
  list-style: none;
  margin: 0;
  padding: 0;
`;

const StyledStageRow = styled.li`
  align-items: center;
  display: flex;
  gap: ${themeCssVariables.spacing[2]};

  &::before {
    color: rgba(255, 255, 255, 0.5);
    content: counter(stage);
    counter-increment: stage;
    font-variant-numeric: tabular-nums;
    text-align: right;
    width: 20px;
  }
`;

const StyledIconButton = styled.button`
  align-items: center;
  background: rgba(255, 255, 255, 0.08);
  border: 0;
  border-radius: 8px;
  color: #fff;
  cursor: pointer;
  display: flex;
  height: 32px;
  justify-content: center;
  width: 32px;

  &:disabled {
    cursor: default;
    opacity: 0.3;
  }
`;

const StyledActions = styled.div`
  align-items: center;
  display: flex;
  flex-wrap: wrap;
  gap: ${themeCssVariables.spacing[2]};
`;

const StyledGhostButton = styled.button`
  align-items: center;
  background: transparent;
  border: 1px dashed rgba(255, 255, 255, 0.3);
  border-radius: 10px;
  color: #fff;
  cursor: pointer;
  display: flex;
  font-family: inherit;
  gap: ${themeCssVariables.spacing[1]};
  height: 36px;
  padding: 0 ${themeCssVariables.spacing[3]};
`;

const StyledPrimaryButton = styled.button`
  background: #fff;
  border: 0;
  border-radius: 12px;
  color: #0b0a12;
  cursor: pointer;
  font-family: inherit;
  font-size: ${themeCssVariables.font.size.md};
  font-weight: 700;
  height: 44px;
  margin-left: auto;
  padding: 0 ${themeCssVariables.spacing[6]};

  &:disabled {
    cursor: default;
    opacity: 0.5;
  }
`;

const StyledError = styled.div`
  background: rgba(255, 80, 80, 0.16);
  border: 1px solid rgba(255, 80, 80, 0.4);
  border-radius: 12px;
  padding: ${themeCssVariables.spacing[3]} ${themeCssVariables.spacing[4]};
`;

const getErrorMessage = (error: unknown) => {
  if (CombinedGraphQLErrors.is(error)) {
    return error.errors[0]?.message;
  }

  return error instanceof Error ? error.message : undefined;
};

export const PulsePipelinesPage = () => {
  const { t } = useLingui();
  const { pipelines } = usePulsePipelines();
  const { createPulsePipeline, isCreating } = useCreatePulsePipeline();
  const [templateId, setTemplateId] = useState(PULSE_PIPELINE_TEMPLATES[0].id);
  const [name, setName] = useState(PULSE_PIPELINE_TEMPLATES[0].name);
  const [stages, setStages] = useState(PULSE_PIPELINE_TEMPLATES[0].stages);
  const [error, setError] = useState<string | null>(null);

  const isNameTaken = pipelines.some(
    (pipeline) =>
      pipeline.name.trim().toLowerCase() === name.trim().toLowerCase(),
  );
  const cleanStages = stages.map((stage) => stage.trim()).filter(Boolean);
  const canCreate =
    name.trim().length > 0 &&
    !isNameTaken &&
    cleanStages.length >= 2 &&
    !isCreating;

  const handlePickTemplate = (id: string) => {
    const template = PULSE_PIPELINE_TEMPLATES.find(
      (candidate) => candidate.id === id,
    );

    if (!isDefined(template)) {
      return;
    }

    setTemplateId(id);
    setName(template.name);
    setStages(template.stages);
  };

  const updateStage = (index: number, value: string) =>
    setStages((current) =>
      current.map((stage, stageIndex) =>
        stageIndex === index ? value : stage,
      ),
    );

  const moveStage = (index: number, offset: number) =>
    setStages((current) => {
      const next = [...current];
      const [moved] = next.splice(index, 1);

      next.splice(index + offset, 0, moved);

      return next;
    });

  const removeStage = (index: number) =>
    setStages((current) =>
      current.filter((_, stageIndex) => stageIndex !== index),
    );

  const handleCreate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    try {
      const viewId = await createPulsePipeline({
        name: name.trim(),
        stages: cleanStages,
      });

      // A full load picks up the new field, board and sidebar entry everywhere at once.
      window.location.assign(`${OPPORTUNITY_BOARD_PATH}?viewId=${viewId}`);
    } catch (createError) {
      setError(
        getErrorMessage(createError) ??
          t`Could not create the pipeline. Try again.`,
      );
    }
  };

  return (
    <PageCardLayout
      header={<PageHeader title={t`Pipelines`} Icon={IconLayoutKanban} />}
    >
      <StyledScroll>
        <section>
          <StyledSectionTitle>{t`Your pipelines`}</StyledSectionTitle>
          <StyledGrid>
            {pipelines.map((pipeline) => (
              <StyledPipelineCard
                key={pipeline.viewId}
                href={`${OPPORTUNITY_BOARD_PATH}?viewId=${pipeline.viewId}`}
              >
                <StyledCardHeader>
                  <StyledCardTitle>
                    <IconLayoutKanban size={18} />
                    {pipeline.name}
                  </StyledCardTitle>
                  <StyledMuted>
                    {pipeline.isDefault
                      ? t`Main`
                      : t`${pipeline.stages.length} stages`}
                  </StyledMuted>
                </StyledCardHeader>
                <StyledTags>
                  {pipeline.stages.map((stage) => (
                    <Tag key={stage.label} color={stage.color as TagColor}>
                      {stage.label}
                    </Tag>
                  ))}
                </StyledTags>
              </StyledPipelineCard>
            ))}
          </StyledGrid>
        </section>

        <StyledBuilder onSubmit={handleCreate}>
          <StyledBuilderTitle>{t`New pipeline`}</StyledBuilderTitle>
          <StyledTemplates>
            {PULSE_PIPELINE_TEMPLATES.map((template) => (
              <StyledTemplateButton
                key={template.id}
                type="button"
                aria-pressed={templateId === template.id}
                onClick={() => handlePickTemplate(template.id)}
              >
                {template.name || t`Custom`}
                <span>{template.description}</span>
              </StyledTemplateButton>
            ))}
          </StyledTemplates>

          <StyledLabel>
            {t`Pipeline name`}
            <StyledInput
              value={name}
              placeholder={t`e.g. Corporate Sales`}
              onChange={(event) => setName(event.target.value)}
            />
          </StyledLabel>
          {isNameTaken && (
            <StyledMuted>{t`You already have a pipeline with this name.`}</StyledMuted>
          )}

          <StyledLabel as="div">
            {t`Stages, in order`}
            <StyledStages>
              {stages.map((stage, index) => (
                <StyledStageRow key={index}>
                  <StyledInput
                    value={stage}
                    aria-label={t`Stage ${index + 1}`}
                    onChange={(event) => updateStage(index, event.target.value)}
                  />
                  <StyledIconButton
                    type="button"
                    aria-label={t`Move up`}
                    disabled={index === 0}
                    onClick={() => moveStage(index, -1)}
                  >
                    <IconArrowUp size={16} />
                  </StyledIconButton>
                  <StyledIconButton
                    type="button"
                    aria-label={t`Move down`}
                    disabled={index === stages.length - 1}
                    onClick={() => moveStage(index, 1)}
                  >
                    <IconArrowDown size={16} />
                  </StyledIconButton>
                  <StyledIconButton
                    type="button"
                    aria-label={t`Remove stage`}
                    disabled={stages.length <= 2}
                    onClick={() => removeStage(index)}
                  >
                    <IconTrash size={16} />
                  </StyledIconButton>
                </StyledStageRow>
              ))}
            </StyledStages>
          </StyledLabel>

          <StyledActions>
            <StyledGhostButton
              type="button"
              onClick={() => setStages((current) => [...current, ''])}
            >
              <IconPlus size={16} />
              {t`Add stage`}
            </StyledGhostButton>
            <StyledPrimaryButton type="submit" disabled={!canCreate}>
              {isCreating ? t`Creating...` : t`Create pipeline`}
            </StyledPrimaryButton>
          </StyledActions>
          {isDefined(error) && <StyledError>{error}</StyledError>}
        </StyledBuilder>
      </StyledScroll>
    </PageCardLayout>
  );
};
